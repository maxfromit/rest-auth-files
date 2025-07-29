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

const testUserForSignup = {
  id: "signup@mail.test",
  password: "TestPassword1!",
}

const testUserForSignin = {
  id: "signin@mail.test",
  password: "TestPassword2!",
}
const testUserForLogout = {
  id: "logout@mail.test",
  password: "TestPassword3!",
}

const testUserForRevocation = {
  id: "revocation@mail.test",
  password: "TestPassword4!",
}

describe("Auth routes", () => {
  beforeAll(async () => {
    await deleteAllUsers()
  })

  afterAll(async () => {
    // await deleteAllUsers()
  })
  describe("Signup", () => {
    test("should fail when signup data is missing", async () => {
      const res = await request(app).post("/signup").send({})
      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty("error")
      expect(res.body.error).toContain("Missing")
    })

    test("should signup a new user", async () => {
      const res = await request(app).post("/signup").send(testUserForSignup)
      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty("accessToken")
      expect(res.body).toHaveProperty("message", "User registered successfully")
      expect(res.headers["set-cookie"]).toBeDefined()
    })

    test("should not allow signup with an existing user id", async () => {
      const res = await request(app).post("/signup").send(testUserForSignup)
      expect(res.status).toBe(500)
      expect(res.body).toHaveProperty("error")
      expect(res.body.error).toContain("already")
    })
  })

  describe("Signin", () => {
    test("should fail when signin data is missing", async () => {
      const res = await request(app).post("/signin").send({})
      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty("error")
      expect(res.body.error).toContain("Missing")
    })

    test("should signin with correct credentials", async () => {
      await request(app).post("/signup").send(testUserForSignin)
      const res = await request(app).post("/signin").send(testUserForSignin)
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty("accessToken")
      expect(res.body).toHaveProperty("message", "Login successful")
      expect(res.headers["set-cookie"]).toBeDefined()
    })

    test("should not signin with wrong password", async () => {
      const res = await request(app)
        .post("/signin")
        .send({ ...testUserForSignin, password: "wrong" })
      expect(res.status).toBe(500)
      expect(res.body).toHaveProperty("error")
      expect(res.body.error).toContain("Invalid password")
    })

    test("should not signin with non-existent user id", async () => {
      const res = await request(app)
        .post("/signin")
        .send({ ...testUserForSignin, id: "wrong" })
      expect(res.status).toBe(500)
      expect(res.body).toHaveProperty("error")
      expect(res.body.error).toContain("Invalid user")
    })
  })

  describe("Logout", () => {
    test("should fail logout if not authorized", async () => {
      const res = await request(app).post("/logout").send()
      expect(res.status).toBe(401)
      expect(res.body).toHaveProperty("error")
      expect(res.body.error).toContain("invalid")
    })

    test("should logout successfully", async () => {
      await request(app).post("/signup").send(testUserForLogout)
      const signinRes = await request(app)
        .post("/signin")
        .send(testUserForLogout)
      const accessToken = signinRes.body.accessToken

      const res = await request(app)
        .post("/logout")
        .set("Authorization", `Bearer ${accessToken}`)
        .send()

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty("message", "Logged out successfully")
    })

    test("should not logout twice with the same token", async () => {
      const signinRes = await request(app)
        .post("/signin")
        .send(testUserForLogout)
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
      expect(res.body).toHaveProperty("error")
      expect(res.body.error).toContain("revoked")
    })
  })

  describe("Revocation - new_token", () => {
    test("should refresh access token with valid refresh token", async () => {
      await request(app).post("/signup").send(testUserForRevocation)
      const signinRes = await request(app)
        .post("/signin")
        .send(testUserForRevocation)
      const cookies = signinRes.headers["set-cookie"]

      const refreshRes = await request(app)
        .post("/signin/new_token")
        .set("Cookie", cookies)
        .send()

      expect(refreshRes.status).toBe(200)
      expect(refreshRes.body).toHaveProperty("accessToken")
      expect(refreshRes.body).toHaveProperty(
        "message",
        "Access token refreshed"
      )
      expect(refreshRes.headers["set-cookie"]).toBeDefined()
    })

    test("should fail to refresh token if refresh token is missing", async () => {
      const res = await request(app).post("/signin/new_token").send()
      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty("error")
    })

    test("should fail to refresh token if refresh token is invalid", async () => {
      await request(app).post("/signin").send(testUserForRevocation)

      const invalidCookie = [
        "refreshToken=eyJhbGdiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Im5ldysxMjM0NTY3ODkwIiwic2Vzc2lvbklkIjoiYzFkNzQ2MjEtZGEzZS00ZjNmLWEyMWQtNGQ5MmE2MDViMWY2IiwiaWF0IjoxNzUzNzMwNTY4LCJleHAiOjE3NTQzMzUzNjh9.QcK91zovO53X4Jn3S7rdFsO7Oy0wjXSsGaIQNTDBkPw; Max-Age=604800; Path=/signin/new_token; Expires=Mon, 04 Aug 2025 19:22:48 GMT; HttpOnly; Secure; SameSite=Strict",
      ]
      const refreshRes = await request(app)
        .post("/signin/new_token")
        .set("Cookie", invalidCookie)
        .send()

      expect(refreshRes.status).toBe(500)
      expect(refreshRes.body).toHaveProperty("error")
      expect(refreshRes.body.error).toContain("nvalid")
    })

    test("should fail to refresh token if refresh token is malformed", async () => {
      await request(app).post("/signin").send(testUserForRevocation)
      const malformedCookie = [
        "refreshToken=malformed; Max-Age=604800; Path=/signin/new_token; Expires=Mon, 04 Aug 2025 19:22:48 GMT; HttpOnly; Secure; SameSite=Strict",
      ]

      const refreshRes = await request(app)
        .post("/signin/new_token")
        .set("Cookie", malformedCookie)
        .send()

      expect(refreshRes.status).toBe(500)
      expect(refreshRes.body).toHaveProperty("error")
      expect(refreshRes.body.error).toContain("malformed")
    })

    test("should not refresh token if it was revoked by logout", async () => {
      const signinRes = await request(app)
        .post("/signin")
        .send(testUserForRevocation)
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

      expect(res.status).toBe(500)
      expect(res.body).toHaveProperty("error")
      expect(res.body.error).toContain("revoked")
    })
  })
})
