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
  id: "new+1234567890",
  password: "TestPassword123!",
}

const testUserForSignin = {
  id: "new+1234567890",
  password: "TestPassword123!",
}
const testUserForLogout = {
  id: "new+1234567890",
  password: "TestPassword123!",
}

const testUserForRevocation = {
  id: "new+1234567890",
  password: "TestPassword123!",
}

describe("Auth routes", () => {
  beforeAll(async () => {
    await deleteAllUsers()
  })

  afterAll(async () => {
    await deleteAllUsers()
  })
  describe("Signup", () => {
    test("should return 400 for missing signup data", async () => {
      const res = await request(app).post("/signup").send({})
      console.log(
        "should return 400 for missing signup data res.status",
        res.status
      )
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

    test("should not signup an existing user", async () => {
      const res = await request(app).post("/signup").send(testUserForSignup)

      expect(res.status).toBe(500)
      expect(res.body).toHaveProperty("error")
      expect(res.body.error).toContain("already")
    })
  })

  describe("Signin", () => {
    test("should return 400 for missing signin data", async () => {
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
      expect(res.status).toBe(500) //
      expect(res.body).toHaveProperty("error")
      expect(res.body.error).toContain("Invalid password")
    })

    test("should not signin with wrong user id", async () => {
      const res = await request(app)
        .post("/signin")
        .send({ ...testUserForSignin, id: "wrong" })
      expect(res.status).toBe(500) //
      expect(res.body).toHaveProperty("error")
      expect(res.body.error).toContain("Invalid user")
    })
  })

  describe("Logout", () => {
    test("should return 401 if not authorized on logout", async () => {
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
      console.log("accessToken", accessToken)

      const res = await request(app)
        .post("/logout")
        .set("Authorization", `Bearer ${accessToken}`)
        .send()

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty("message", "Logged out successfully")
    })

    test("should return 401 if session not found or already revoked", async () => {
      const signinRes = await request(app)
        .post("/signin")
        .send(testUserForLogout)
      const accessToken = signinRes.body.accessToken

      await request(app)
        .post("/logout")
        .set("Authorization", `Bearer ${accessToken}`)
        .send() // Logout to revoke the session

      const res = await request(app)
        .post("/logout")
        .set("Authorization", `Bearer ${accessToken}`)
        .send()

      console.log("res.status", res.status)

      expect(res.status).toBe(401)
      expect(res.body).toHaveProperty("error")
      expect(res.body.error).toContain("revoked")
    })
  })

  describe("Revocation - new_token", () => {
    test("should refresh access token with valid refresh token", async () => {
      // First, sign in to get the refresh token cookie
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

    test("should return 400 for missing refresh token", async () => {
      const res = await request(app).post("/signin/new_token").send()
      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty("error")
    })

    test("should return 500 for invalid refresh token", async () => {
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

    test("should return 500 for malformed refresh token", async () => {
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

    test("should return 500 for revoked with logout refresh token", async () => {
      const signinRes = await request(app)
        .post("/signin")
        .send(testUserForRevocation)
      const accessToken = signinRes.body.accessToken
      const cookies = signinRes.headers["set-cookie"]

      await request(app)
        .post("/logout")
        .set("Authorization", `Bearer ${accessToken}`)
        .send() // Logout to revoke the session

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
