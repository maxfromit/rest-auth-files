import request from "supertest"

import { describe, expect, test, beforeAll, afterAll } from "vitest"

const testUser = {
  id: "new+1234567890",
  password: "TestPassword123!",
}

const baseUrl = "http://localhost:3000"

describe("Auth routes", () => {
  beforeAll(async () => {})

  afterAll(async () => {
    // TODO clean up test user
    // await request(baseUrl).delete(`/users/${testUser.id}`)
  })

  test("should return 400 for missing signup data", async () => {
    const res = await request(baseUrl).post("/signup").send({})
    console.log("should return 400 for missing signup data res.body", res.body)
    console.log(
      "should return 400 for missing signup data res.status",
      res.status
    )
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty("error")
  })

  test("should signup a new user", async () => {
    const res = await request(baseUrl).post("/signup").send(testUser)
    console.log("should signup a new user res.status", res.status)
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty("accessToken")
    expect(res.body).toHaveProperty("message", "User registered successfully")
    console.log("res.headers=cookie", res.headers["set-cookie"])
    // TODO check for set-cookie header for refreshToken
    expect(res.headers["set-cookie"]).toBeDefined()
  })

  test("should not signup an existing user", async () => {
    const res = await request(baseUrl).post("/signup").send(testUser)
    console.log("should not signup an existing userres.body", res.body)
    console.log("should not signup an existing user res.status", res.status)
    expect(res.status).toBe(500)
    expect(res.body).toHaveProperty("error")
  })

  test("should return 400 for missing signin data", async () => {
    const res = await request(baseUrl).post("/signin").send({})
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty("error")
  })

  test("should signin with correct credentials", async () => {
    const res = await request(baseUrl).post("/signin").send(testUser)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty("accessToken")
    expect(res.body).toHaveProperty("message", "Login successful")
    expect(res.headers["set-cookie"]).toBeDefined()
  })

  test("should not signin with wrong password", async () => {
    const res = await request(baseUrl)
      .post("/signin")
      .send({ ...testUser, password: "wrong" })
    expect(res.status).toBe(500) //
    expect(res.body).toHaveProperty("error")
  })

  test("should refresh access token with valid refresh token", async () => {
    // First, sign in to get the refresh token cookie
    const signinRes = await request(baseUrl).post("/signin").send(testUser)
    console.log("signinRes.headers=cookie", signinRes.headers["set-cookie"])
    const cookies = signinRes.headers["set-cookie"]
    const refreshRes = await request(baseUrl)
      .post("/signin/new_token")
      .set("Cookie", cookies)
      .send()
    expect(refreshRes.status).toBe(200)
    expect(refreshRes.body).toHaveProperty("accessToken")
    expect(refreshRes.body).toHaveProperty("message", "Access token refreshed")
    expect(refreshRes.headers["set-cookie"]).toBeDefined()
  })

  test("should return 400 for missing refresh token", async () => {
    const res = await request(baseUrl).post("/signin/new_token").send()
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty("error")
  })
})
