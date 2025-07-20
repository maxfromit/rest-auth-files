import type { Request, Response } from "express"
import {
  upsertFileRecordService,
  getFileListService,
  getFileDetailsService,
  getFileDetailsWithPathService,
  deleteFileService,
} from "../services/fileServices.js"

async function upsertFileController(req: Request, res: Response) {
  const file = req.file
  if (!file) {
    return res.status(400).json({ error: "No file uploaded" })
  }
  try {
    const message = req.params.id
      ? "File updated successfully"
      : "File uploaded successfully"

    await upsertFileRecordService(file)

    return res.status(201).json({ message })
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message })
  }
}

async function getFileListController(req: Request, res: Response) {
  const page =
    !!Number(req.query.page) && Number(req.query.page) > 0
      ? Number(req.query.page)
      : 1

  const listSize =
    !!Number(req.query.list_size) && Number(req.query.list_size) > 0
      ? Number(req.query.list_size)
      : 10

  try {
    const files = await getFileListService(page, listSize)
    return res.status(200).json({ files })
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message })
  }
}

async function getFileDetailsController(req: Request, res: Response) {
  const { id } = req.params
  try {
    const file = await getFileDetailsService(id)
    if (!file) {
      return res.status(404).json({ error: "File not found" })
    }
    return res.status(200).json({ file })
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message })
  }
}

async function downloadFileController(req: Request, res: Response) {
  const { id } = req.params
  try {
    const { file, filePath } = await getFileDetailsWithPathService(id)
    if (!file || !filePath) {
      return res.status(404).json({ error: "File not found" })
    }
    return res.download(filePath, file.name || id)
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message })
  }
}

async function deleteFileController(req: Request, res: Response) {
  const { id } = req.params
  try {
    await deleteFileService(id)
    return res.status(200).json({ message: "File deleted successfully" })
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message })
  }
}

export {
  upsertFileController,
  getFileListController,
  getFileDetailsController,
  downloadFileController,
  deleteFileController,
}
