import request from "supertest"
import app from "../../app.js"
import { describe, expect, test, beforeAll, afterAll } from "vitest"
import { deleteAllUsers } from "../../db/scripts/deleteUsers.js"
import { signup, signin } from "../utils.js"
import type { User } from "../types.js"

const testUser: User = {
  id: "info@mail.test",
  password: "TestPassword5!",
}

describe("Info routes", () => {
  beforeAll(async () => {
    await deleteAllUsers()
  })

  afterAll(async () => {
    await deleteAllUsers()
  })

  test("should fail to get user info if not authorized", async () => {
    const res = await request(app).get("/info").send()
    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty("error")
    expect(res.body.error).toContain("invalid")
  })

  test("should return user id if authorized", async () => {
    await signup(testUser)
    const signinRes = await signin(testUser)
    const accessToken = signinRes.body.accessToken

    const res = await request(app)
      .get("/info")
      .set("Authorization", `Bearer ${accessToken}`)
      .send()

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty("id", testUser.id)
  })
})
