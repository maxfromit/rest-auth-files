import request from "supertest"
import app from "../../app.js"
import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  vi,
} from "vitest"
import { deleteAllUsers } from "../../db/scripts/deleteUsers.js"
import { deleteAllFiles } from "../../db/scripts/deleteFiles.js"
import { signup, signin } from "../utils.js"
import type { User } from "../types.js"
import {
  fileMessages,
  authMessages,
  errorKey,
  messageKey,
} from "../../consts/messages.js"
import { db } from "../../db/index.js"
import { getUploadDir } from "../../utils/getUploadDir.js"
import { deleteFileService } from "../../services/fileServices.js"

const testUser: User = {
  id: "file@mail.test",
  password: "TestPassword6!",
}

const testFileName = "testfile.txt"
const testFilePath = `${getUploadDir()}/${testFileName}`

let accessToken: string
let fileIds: string[] = []

async function uploadFile(instruction?: "noPushToFileIds") {
  const fileMock = Buffer.from("Test file content", "utf-8")
  const res = await request(app)
    .post("/file/upload")
    .set("Authorization", `Bearer ${accessToken}`)
    .attach("file", fileMock, {
      filename: testFileName,
      contentType: "image/jpeg",
    })
  if (instruction !== "noPushToFileIds") {
    fileIds.push(res.body.id) // Store the file ID for cleanup later
  }
  return res
}

describe("File routes", () => {
  beforeAll(async () => {
    await deleteAllUsers()
    await deleteAllFiles()

    await signup(testUser)
    const signinRes = await signin(testUser)
    accessToken = signinRes.body.accessToken
  })

  afterAll(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (fileIds.length > 0) {
      await Promise.all(fileIds.map((id) => deleteFileService(id)))
      fileIds.length = 0
    }
  })

  describe("POST /upload", () => {
    test("should fail if not authorized", async () => {
      const fileMock = Buffer.from("Test file content", "utf-8")
      const res = await request(app)
        .post("/file/upload")
        .attach("file", fileMock, {
          filename: testFileName,
        })

      expect(res.status).toBe(401)
      expect(res.body).toHaveProperty(
        errorKey,
        authMessages.error.missingAuthHeader
      )
    })

    test("should fail if no file uploaded", async () => {
      const res = await request(app)
        .post("/file/upload")
        .set("Authorization", `Bearer ${accessToken}`)
      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty(
        errorKey,
        fileMessages.error.noFileUploaded
      )
    })

    test("should upload successfully", async () => {
      const res = await uploadFile()
      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty(
        messageKey,
        fileMessages.success.fileUploaded
      )
      expect(res.body).toHaveProperty("id")
    })
    // Success and duplicate upload cases would require a real file and cleanup
  })

  describe("GET /list", () => {
    test("should fail if not authorized", async () => {
      const res = await request(app).get("/file/list")
      expect(res.status).toBe(401)
      expect(res.body).toHaveProperty(
        errorKey,
        authMessages.error.missingAuthHeader
      )
    })
    test("should list uploaded files", async () => {
      // Upload 5 files
      const uploadResults = []
      for (let i = 0; i < 5; i++) {
        uploadResults.push(await uploadFile())
      }
      const uploadedIds = uploadResults.map((r) => r.body.id)
      const res = await request(app)
        .get("/file/list")
        .set("Authorization", `Bearer ${accessToken}`)
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty("files")
      expect(Array.isArray(res.body.files)).toBe(true)
      // All uploaded file ids should be present in the files list
      for (const id of uploadedIds) {
        expect(res.body.files.some((f: any) => f.id === id)).toBe(true)
      }
    })
  })

  describe("GET /:id", () => {
    test("should fail if not authorized", async () => {
      const res = await request(app).get("/file/someid")
      expect(res.status).toBe(401)
      expect(res.body).toHaveProperty(
        errorKey,
        authMessages.error.missingAuthHeader
      )
    })

    test("should return 404 if file not found", async () => {
      const res = await request(app)
        .get("/file/nonexistentid")
        .set("Authorization", `Bearer ${accessToken}`)
      expect(res.status).toBe(404)
      expect(res.body).toHaveProperty(errorKey, fileMessages.error.fileNotFound)
    })

    test("should get uploaded file details", async () => {
      const resUpload = await uploadFile()
      const res = await request(app)
        .get(`/file/${resUpload.body.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty("file")
      expect(res.body.file.id).toBe(resUpload.body.id)
    })
  })

  describe("GET /download/:id", () => {
    test("should fail if not authorized", async () => {
      const res = await request(app).get("/file/download/someid")
      expect(res.status).toBe(401)
      expect(res.body).toHaveProperty(
        errorKey,
        authMessages.error.missingAuthHeader
      )
    })

    test("should return 404 if file not found", async () => {
      const res = await request(app)
        .get("/file/download/nonexistentid")
        .set("Authorization", `Bearer ${accessToken}`)
      expect(res.status).toBe(404)
      expect(res.body).toHaveProperty(errorKey, fileMessages.error.fileNotFound)
    })

    test("should download uploaded file", async () => {
      const resUpload = await uploadFile()
      const res = await request(app)
        .get(`/file/download/${resUpload.body.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
      expect(res.status).toBe(200)
      expect(res.header["content-disposition"]).toContain(testFileName)
      expect(res.text).toBe("Test file content")
    })
  })

  describe("DELETE /delete/:id", () => {
    test("should fail if not authorized", async () => {
      const res = await request(app).delete("/file/delete/someid")
      expect(res.status).toBe(401)
      expect(res.body).toHaveProperty(
        errorKey,
        authMessages.error.missingAuthHeader
      )
    })
    test("should return 404 if file not found", async () => {
      const res = await request(app)
        .delete("/file/delete/nonexistentid")
        .set("Authorization", `Bearer ${accessToken}`)
      expect(res.status).toBe(404)
      expect(res.body).toHaveProperty(errorKey, fileMessages.error.fileNotFound)
    })

    test("should return 400 if file was deleted from fs but not in db (fileMayNotExist)", async () => {
      const res = await uploadFile("noPushToFileIds")
      const idToDelete = res.body.id

      // Mock db.delete to return 0 affectedRows after successful unlink
      const resultOfDeleted = {
        fieldCount: 0,
        affectedRows: 0,
        insertId: 0,
        info: "",
        serverStatus: 2,
        warningStatus: 0,
        changedRows: 0,
      }

      const mockDeleteChain = {
        where: () => Promise.resolve([resultOfDeleted]),
      } as unknown as ReturnType<typeof db.delete>

      vi.spyOn(db, "delete").mockReturnValue(mockDeleteChain)

      const deleteRes = await request(app)
        .delete(`/file/delete/${idToDelete}`)
        .set("Authorization", `Bearer ${accessToken}`)

      expect(deleteRes.status).toBe(400)
      expect(deleteRes.body).toHaveProperty(
        errorKey,
        fileMessages.error.fileMayNotExist
      )
      vi.restoreAllMocks()
    })

    test("should return 200 and fileDeleted message on successful delete", async () => {
      const res = await uploadFile("noPushToFileIds")

      const id = res.body.id
      const deleteRes = await request(app)
        .delete(`/file/delete/${id}`)
        .set("Authorization", `Bearer ${accessToken}`)

      expect(deleteRes.status).toBe(200)
      expect(deleteRes.body).toHaveProperty(
        messageKey,
        fileMessages.success.fileDeleted
      )
    })
  })

  describe("PUT /update/:id", () => {
    test("should fail if not authorized", async () => {
      const fileMock = Buffer.from("Test file content", "utf-8")
      const res = await request(app)
        .put("/file/update/someid")
        .attach("file", fileMock, {
          filename: testFileName,
        })

      expect(res.status).toBe(401)
      expect(res.body).toHaveProperty(
        errorKey,
        authMessages.error.missingAuthHeader
      )
    })

    test("should fail if no file uploaded", async () => {
      const res = await request(app)
        .put("/file/update/someid")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(404)
      expect(res.body).toHaveProperty(errorKey, fileMessages.error.fileNotFound)
    })

    test("should return 404 if file not found for update", async () => {
      const fileMock = Buffer.from("Test file content", "utf-8")

      const res = await request(app)
        .put("/file/update/nonexistentid")
        .set("Authorization", `Bearer ${accessToken}`)
        .attach("file", fileMock, {
          filename: testFileName,
          contentType: "image/jpeg",
        })
      // removeExistingFileMiddleware returns 404 if file not found
      expect(res.status).toBe(404)
      expect(res.body).toHaveProperty(errorKey, fileMessages.error.fileNotFound)
    })

    test("should update uploaded file", async () => {
      const resUpload = await uploadFile()
      const newFileMock = Buffer.from("Updated file content", "utf-8")
      const res = await request(app)
        .put(`/file/update/${resUpload.body.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .attach("file", newFileMock, {
          filename: testFileName,
          contentType: "image/jpeg",
        })

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty(
        messageKey,
        fileMessages.success.fileUpdated
      )
      expect(res.body).toHaveProperty("id", resUpload.body.id)
    })
  })
})
