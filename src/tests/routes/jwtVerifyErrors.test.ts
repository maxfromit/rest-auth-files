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
import {
  JWTtokenErrors,
  authMessages,
  errorKey,
} from "../../consts/messages.js"

const expiredAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImluZm9AbWFpbC50ZXN0Iiwic2Vzc2lvbklkIjoiMTJhMzJlMGUtYWJkMS00MTQ3LThmNmUtOTJjMzI4NzkzYWU0IiwiaWF0IjoxNzUzODY2MTU4LCJleHAiOjE3NTM4NjYxNjh9.pFsQ5DLxNVkV7Wgj5Zp6Jdch2r8Ed6NCYWyY1R64uT4"

const withoutIdSignatureAccessInfinityToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ3cm9uZyI6InNpZ25pbkBtYWlsLnRlc3QiLCJzZXNzaW9uSWQiOiJhNTllY2UwMS00NzViLTRjODItYWQ2Zi1hNTc2ZTE3ODIwY2IiLCJpYXQiOjE3NTM4ODAyMjZ9.yZEvt8e3M935CBOytg-4UISy2JgKh2X3GFs1AiUf1wk"

const invalidToken = "invalid.token.string"

const malformedToken = "malformed-token-string"

const expiredRefreshToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImluZm9AbWFpbC50ZXN0Iiwic2Vzc2lvbklkIjoiMTJhMzJlMGUtYWJkMS00MTQ3LThmNmUtOTJjMzI4NzkzYWU0IiwiaWF0IjoxNzUzODY2MTU4LCJleHAiOjE3NTM4NjYxNjh9.T6g4BQyWv7PIlAo5vQzBFTDq5fh65j0Q5dQqVpxMw6w"

const wrongSignaturedAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImluZe9AbWFpbC50ZXN0Iiwic2Vzc2lvbklkIjoiMTJhMzJlMGUtYWJkMS00MTQ3OahtNmUtOTJjMzI4NzkzYWU0IiwiaWF0IjoxNzUzODY2MTU4LCJleHAiOjE3NTM4NjYxNjh9.T6g4BQIWv7PIlAo5vQtBFTDq5fh65j0Q5dQqVpxMw6w"

function getCookieByToken(token: string) {
  return `refreshToken=${token}; Max-Age=604800; Path=/signin/new_token; Expires=Mon, 04 Aug 2025 19:22:48 GMT; HttpOnly; Secure; SameSite=Strict`
}

describe("Auth routes", () => {
  test("should fail to logout if use expired token", async () => {
    const res = await request(app)
      .post("/logout")
      .set("Authorization", `Bearer ${expiredAccessToken}`)
      .send()

    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty(errorKey, JWTtokenErrors.expired)
  })

  test("should fail to logout if use token without id key", async () => {
    const res = await request(app)
      .post("/logout")
      .set("Authorization", `Bearer ${withoutIdSignatureAccessInfinityToken}`)
      .send()
    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty(errorKey, authMessages.error.invalidPayload)
  })

  test("should fail to logout if use token with wrong signature", async () => {
    const res = await request(app)
      .post("/logout")
      .set("Authorization", `Bearer ${wrongSignaturedAccessToken}`)
      .send()

    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty(errorKey, JWTtokenErrors.invalidSignature)
  })

  test("should fail to refresh token if refresh token is invalid", async () => {
    const refreshRes = await request(app)
      .post("/signin/new_token")
      .set("Cookie", getCookieByToken(invalidToken))
      .send()

    expect(refreshRes.status).toBe(500)
    expect(refreshRes.body).toHaveProperty(
      errorKey,
      JWTtokenErrors.invalidToken
    )
  })

  test("should fail to refresh token if refresh token is malformed", async () => {
    const refreshRes = await request(app)
      .post("/signin/new_token")
      .set("Cookie", getCookieByToken(malformedToken))
      .send()

    expect(refreshRes.status).toBe(500)
    expect(refreshRes.body).toHaveProperty(errorKey, JWTtokenErrors.malformed)
  })

  test("should fail to refresh token if refresh token is expired", async () => {
    const refreshRes = await request(app)
      .post("/signin/new_token")
      .set("Cookie", getCookieByToken(expiredRefreshToken))
      .send()

    expect(refreshRes.status).toBe(500)
    expect(refreshRes.body).toHaveProperty(errorKey, JWTtokenErrors.expired)
  })
})
