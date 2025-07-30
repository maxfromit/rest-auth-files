import request from "supertest"
import app from "../../app.js"
import {
  describe,
  expect,
  test,
  beforeAll,
  beforeEach,
  afterAll,
  afterEach,
} from "vitest"
import { deleteAllUsers } from "../../db/scripts/deleteUsers.js"
import { signup, signin } from "../utils.js"
import type { User } from "../types.js"
import { authMessages, errorKey, messageKey } from "../../consts/messages.js"
import { vi } from "vitest"
import { db } from "../../db/index.js"

const testUserForSignup: User = {
  id: "signup@mail.test",
  password: "TestPassword1!",
}

const testUserForSignin: User = {
  id: "signin@mail.test",
  password: "TestPassword2!",
}
const testUserForLogout: User = {
  id: "logout@mail.test",
  password: "TestPassword3!",
}

const testUserForRevocation: User = {
  id: "revocation@mail.test",
  password: "TestPassword4!",
}

function mockReturnsEmptyArray() {
  return {
    set: () => ({
      where: () => Promise.resolve([]),
    }),
  } as unknown as ReturnType<typeof db.update>
}

function mockExpiredRefreshedToken() {
  // Mock the database response to simulate an expired refresh token
  const tokenRowWithExpiredOne = {
    id: 112,
    user_id: "user@expired.com",
    refresh_token: "expired.refresh.token.string",
    session_id: "188002dd-3eb4-4224-90d4-1b4c778e0b45",
    expires_at: new Date(Date.now() - 1000), // expired
    revoked_at: null,
  }

  const mockSelectChain = {
    from: () => ({
      where: () => Promise.resolve([tokenRowWithExpiredOne]),
    }),
  } as unknown as ReturnType<typeof db.select>

  vi.spyOn(db, "select").mockReturnValue(mockSelectChain)
}

describe("Auth routes", () => {
  beforeAll(async () => {
    await deleteAllUsers()
  })

  afterAll(async () => {
    // await deleteAllUsers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("Signup", () => {
    test("should fail when signup data is missing", async () => {
      const res = await request(app).post("/signup").send({})
      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty(
        errorKey,
        authMessages.error.missingAuthData
      )
    })

    test("should signup a new user", async () => {
      const res = await signup(testUserForSignup)
      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty("accessToken")
      expect(res.body).toHaveProperty(
        messageKey,
        authMessages.success.signupSuccessful
      )
      expect(res.headers["set-cookie"]).toBeDefined()
    })

    test("should not allow signup with an existing user id", async () => {
      const res = await signup(testUserForSignup)
      expect(res.status).toBe(500)
      expect(res.body).toHaveProperty(
        errorKey,
        authMessages.error.userAlreadyExists
      )
    })
  })

  describe("Signin", () => {
    test("should fail when signin data is missing", async () => {
      const res = await request(app).post("/signin").send({})
      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty(
        errorKey,
        authMessages.error.missingAuthData
      )
    })

    test("should signin with correct credentials", async () => {
      await signup(testUserForSignin)
      const res = await signin(testUserForSignin)
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty("accessToken")
      expect(res.body).toHaveProperty(
        messageKey,
        authMessages.success.loginSuccessful
      )
      expect(res.headers["set-cookie"]).toBeDefined()
    })

    test("should not signin with wrong password", async () => {
      const res = await request(app)
        .post("/signin")
        .send({ ...testUserForSignin, password: "wrong" })
      expect(res.status).toBe(500)
      expect(res.body).toHaveProperty(
        errorKey,
        authMessages.error.invalidPassword
      )
    })

    test("should not signin with non-existent user id", async () => {
      const res = await request(app)
        .post("/signin")
        .send({ ...testUserForSignin, id: "wrong" })
      expect(res.status).toBe(500)
      expect(res.body).toHaveProperty(
        errorKey,
        authMessages.error.invalidUserId
      )
    })
  })

  describe("Logout", () => {
    test("should logout successfully", async () => {
      await signup(testUserForLogout)
      const signinRes = await signin(testUserForLogout)
      const accessToken = signinRes.body.accessToken

      const res = await request(app)
        .post("/logout")
        .set("Authorization", `Bearer ${accessToken}`)
        .send()

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty(
        messageKey,
        authMessages.success.logoutSuccessful
      )
    })

    test("should fail logout if missed accessToken", async () => {
      const res = await request(app).post("/logout").send()
      expect(res.status).toBe(401)
      expect(res.body).toHaveProperty(
        errorKey,
        authMessages.error.missingAuthHeader
      )
    })

    test("should not logout twice with the same token", async () => {
      const signinRes = await signin(testUserForLogout)
      const accessToken = signinRes.body.accessToken

      await request(app)
        .post("/logout")
        .set("Authorization", `Bearer ${accessToken}`)
        .send()

      const res = await request(app)
        .post("/logout")
        .set("Authorization", `Bearer ${accessToken}`)
        .send()

      expect(res.status).toBe(401)
      expect(res.body).toHaveProperty(
        errorKey,
        authMessages.error.sessionRevoked
      )
    })

    test("should not logout if refresh token is expired in db ", async () => {
      const signinRes = await signin(testUserForLogout)
      const accessToken = signinRes.body.accessToken

      // Mock the database response to simulate expired session
      mockExpiredRefreshedToken()
      const res = await request(app)
        .post("/logout")
        .set("Authorization", `Bearer ${accessToken}`)
        .send()

      expect(res.status).toBe(401)
      expect(res.body).toHaveProperty(
        errorKey,
        authMessages.error.refreshTokenExpired
      )
    })
  })

  describe("New Token", () => {
    test("should refresh access token with valid refresh token", async () => {
      await signup(testUserForRevocation)
      const signinRes = await signin(testUserForRevocation)
      const cookies = signinRes.headers["set-cookie"]

      const refreshRes = await request(app)
        .post("/signin/new_token")
        .set("Cookie", cookies)
        .send()

      expect(refreshRes.status).toBe(200)
      expect(refreshRes.body).toHaveProperty("accessToken")
      expect(refreshRes.body).toHaveProperty(
        messageKey,
        authMessages.success.accessTokenRefreshed
      )
      expect(refreshRes.headers["set-cookie"]).toBeDefined()
    })

    test("should fail to refresh token if refresh token is missing", async () => {
      const res = await request(app).post("/signin/new_token").send()
      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty(
        errorKey,
        authMessages.error.missingRefreshToken
      )
    })

    test("should not refresh token if it was revoked by logout", async () => {
      const signinRes = await signin(testUserForRevocation)
      const accessToken = signinRes.body.accessToken
      const cookies = signinRes.headers["set-cookie"]

      await request(app)
        .post("/logout")
        .set("Authorization", `Bearer ${accessToken}`)
        .send()

      const res = await request(app)
        .post("/signin/new_token")
        .set("Cookie", cookies)
        .send()

      expect(res.status).toBe(401)
      expect(res.body).toHaveProperty(
        errorKey,
        authMessages.error.invalidOrRevokedRefreshToken
      )
    })

    test("should not refresh access token with valid refresh token which was expired in db", async () => {
      const signinResToGetRefreshToken = await signin(testUserForRevocation)

      const cookies = signinResToGetRefreshToken.headers["set-cookie"]

      // Mock the database response to simulate an expired refresh token
      mockExpiredRefreshedToken()

      // Attempt to refresh the token with the "expired refresh" token
      const refreshRes = await request(app)
        .post("/signin/new_token")
        .set("Cookie", cookies)
        .send()

      expect(refreshRes.status).toBe(401)
      expect(refreshRes.body).toHaveProperty(
        errorKey,
        authMessages.error.refreshTokenExpired
      )
    })

    test("should not refresh access token with valid refresh token which was vanished from db", async () => {
      const signinRes = await signin(testUserForRevocation)

      const cookies = signinRes.headers["set-cookie"]

      // Mock the database response to simulate a vanished refresh token
      function mockUpdateReturnsEmptyArray(target: any) {
        target.update = () => mockReturnsEmptyArray()
      }

      vi.spyOn(db, "transaction").mockImplementation(async (cb) => {
        const mockTx: any = {}
        mockUpdateReturnsEmptyArray(mockTx)
        return cb(mockTx)
      })

      const refreshRes = await request(app)
        .post("/signin/new_token")
        .set("Cookie", cookies)
        .send()

      expect(refreshRes.status).toBe(500)
      expect(refreshRes.body).toHaveProperty(
        errorKey,
        authMessages.error.sessionNotFoundOrRevoked
      )
    })
  })
})
