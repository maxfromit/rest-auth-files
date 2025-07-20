import { db } from "../db/index.js"
import { filesTable } from "../db/schema.js"
import { basename, extname } from "path"
import { sql, eq } from "drizzle-orm"
import { unlink } from "fs/promises"
import { getFilePath } from "../utils/getFilePath.js"

async function getFileDetailsService(id: string) {
  const result = await db
    .select()
    .from(filesTable)
    .where(eq(filesTable.id, id))
    .limit(1)

  return result[0] || null
}

async function getFileDetailsWithPathService(id: string) {
  const file = await getFileDetailsService(id)
  if (!file) return { file: null, filePath: null }
  const filePath = getFilePath(id, file.extension)
  return { file, filePath }
}

async function upsertFileRecordService(file: Express.Multer.File) {
  const fileExtension = extname(file.filename)
  const filenameWithoutExt = basename(file.filename, fileExtension)

  const fileData = {
    id: filenameWithoutExt,
    name: file.originalname,
    extension: fileExtension,
    mime_type: file.mimetype,
    size: file.size,
    uploaded_at: new Date(),
  }
  await db.insert(filesTable).values(fileData).onDuplicateKeyUpdate({
    set: fileData,
  })
}

async function getFileListService(page: number, listSize: number) {
  const offset = (page - 1) * listSize
  return await db.select().from(filesTable).limit(listSize).offset(offset)
}

async function deleteFileService(id: string) {
  const file = await getFileDetailsService(id)
  if (!file) throw new Error("File not found")
  const filePath = getFilePath(id, file.extension)

  await unlink(filePath)

  const result = await db.delete(filesTable).where(eq(filesTable.id, id))

  const deleteHeader = Array.isArray(result) ? result[0] : result

  if (deleteHeader.affectedRows === 0) {
    throw new Error("file may not exist")
  }
}

export {
  getFileDetailsService,
  getFileDetailsWithPathService,
  upsertFileRecordService,
  getFileListService,
  deleteFileService,
}
