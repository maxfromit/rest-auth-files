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
import { vi } from "vitest"
import { db } from "../../db/index.js"
import * as dbModule from "../../db/index.js"
import { usersTable } from "../../db/schema.js"
import { deleteAllUsers } from "../../db/scripts/deleteUsers.js"
import bcrypt from "bcrypt"

const testUser = {
  id: "new+1234567890",
  password: "TestPassword123!",
}

vi.mock("../../db/index.js", async (importOriginal) => {
  const mod = await importOriginal<typeof db>() // type is inferred
  return {
    ...mod,
    // replace some exports
    total: vi.fn(),
  }
})

const result = db.select().from(usersTable)

describe("Auth routes", () => {
  let selectMock: any
  let insertMock: any
  let transactionMock: any

  // beforeAll(async () => {

  //   // await deleteAllUsers()
  // })

  beforeEach(() => {
    const mockBcryptHash = async (
      data: string | Buffer,
      saltOrRounds: string | number
    ) => {
      return "mocked-hash"
    }

    const mockBcryptCompare = async (
      data: string | Buffer,
      encrypted: string
    ) => {
      return true
    }

    vi.spyOn(bcrypt, "hash").mockImplementation(mockBcryptHash)
    vi.spyOn(bcrypt, "compare").mockImplementation(mockBcryptCompare)

    const mockInsertChain = {
      values: vi.fn().mockReturnThis(),
    } as unknown as ReturnType<typeof db.insert>

    const mockSelectChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]), // or mockReturnValueOnce([...])
    } as unknown as ReturnType<typeof db.select>

    const mockUpdateChain = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
    } as unknown as ReturnType<typeof db.update>

    type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

    const mockTransaction = {
      insert: vi.fn().mockReturnValue(mockInsertChain),
      rollback: vi.fn(),
    } as unknown as Transaction

    vi.spyOn(db, "select").mockReturnValue(mockSelectChain)
    vi.spyOn(db, "insert").mockReturnValue(mockInsertChain)
    vi.spyOn(db, "transaction").mockImplementation(async (cb) => {
      console.log("mockTransaction", mockTransaction)
      return cb(mockTransaction)
    })
    vi.spyOn(db, "update").mockReturnValue(mockUpdateChain)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  afterAll(async () => {
    // TODO clean up test user
    // await deleteAllUsers()
    // await request().delete(`/users/${testUser.id}`)
  })

  test("GET /health-check should return status OK", async () => {
    const response = await request(app).get("/health-check")

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({ status: "ok" })
  })

  //   test("GET /info should return status OK", async () => {
  //   const response = await request(app).get("/info")

  //   expect(response.statusCode).toBe(200)
  //   expect(response.body).toEqual({ status: "ok" })
  // })

  test("should return 400 for missing signup data", async () => {
    const res = await request(app).post("/signup").send({})
    console.log("should return 400 for missing signup data res.body", res.body)
    console.log(
      "should return 400 for missing signup data res.status",
      res.status
    )
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty("error")
  })

  test("should signup a new user", async () => {
    const res = await request(app).post("/signup").send(testUser)

    console.log("should signup a new user res.status", res.status)
    console.log("should signup a new user res.body", res.body)

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty("accessToken")
    expect(res.body).toHaveProperty("message", "User registered successfully")
    console.log("res.headers=cookie", res.headers["set-cookie"])
    // TODO check for set-cookie header for refreshToken
    expect(res.headers["set-cookie"]).toBeDefined()
  })

  test.skip("should not signup an existing user", async () => {
    const res = await request(app).post("/signup").send(testUser)
    console.log("should not signup an existing userres.body", res.body)
    console.log("should not signup an existing user res.status", res.status)
    expect(res.status).toBe(500)
    expect(res.body).toHaveProperty("error")
  })

  test.skip("should return 400 for missing signin data", async () => {
    const res = await request(app).post("/signin").send({})
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty("error")
  })

  test.skip("should signin with correct credentials", async () => {
    const res = await request(app).post("/signin").send(testUser)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty("accessToken")
    expect(res.body).toHaveProperty("message", "Login successful")
    expect(res.headers["set-cookie"]).toBeDefined()
  })

  test.skip("should not signin with wrong password", async () => {
    const res = await request(app)
      .post("/signin")
      .send({ ...testUser, password: "wrong" })
    expect(res.status).toBe(500) //
    expect(res.body).toHaveProperty("error")
  })

  test.skip("should refresh access token with valid refresh token", async () => {
    // First, sign in to get the refresh token cookie
    const signinRes = await request(app).post("/signin").send(testUser)
    console.log("signinRes.headers=cookie", signinRes.headers["set-cookie"])
    const cookies = signinRes.headers["set-cookie"]
    const refreshRes = await request(app)
      .post("/signin/new_token")
      .set("Cookie", cookies)
      .send()
    expect(refreshRes.status).toBe(200)
    expect(refreshRes.body).toHaveProperty("accessToken")
    expect(refreshRes.body).toHaveProperty("message", "Access token refreshed")
    expect(refreshRes.headers["set-cookie"]).toBeDefined()
  })

  test.skip("should return 400 for missing refresh token", async () => {
    const res = await request(app).post("/signin/new_token").send()
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty("error")
  })
})
