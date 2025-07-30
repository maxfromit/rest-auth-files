import type { Request, Response } from "express"
import {
  upsertFileRecordService,
  getFileListService,
  getFileDetailsService,
  getFileDetailsWithPathService,
  deleteFileService,
} from "../services/fileServices.js"
import { fileMessages, asError, asMessage } from "../consts/messages.js"

async function upsertFileController(req: Request, res: Response) {
  // Debugging line
  const file = req.file
  if (!file) {
    return res.status(400).json(asError(fileMessages.error.noFileUploaded))
  }
  try {
    const message = req.params.id
      ? fileMessages.success.fileUpdated
      : fileMessages.success.fileUploaded

    const fileData = await upsertFileRecordService(file)

    // Return id of uploaded file for test cleanup or further actions
    const id = fileData.id
    return res.status(201).json({ ...asMessage(message), id })
  } catch (err) {
    return res.status(500).json(asError((err as Error).message))
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
    return res.status(500).json(asError((err as Error).message))
  }
}

async function getFileDetailsController(req: Request, res: Response) {
  const { id } = req.params
  try {
    const file = await getFileDetailsService(id)
    if (!file) {
      return res.status(404).json(asError(fileMessages.error.fileNotFound))
    }
    return res.status(200).json({ file })
  } catch (err) {
    return res.status(500).json(asError((err as Error).message))
  }
}

async function downloadFileController(req: Request, res: Response) {
  const { id } = req.params
  try {
    const { file, filePath } = await getFileDetailsWithPathService(id)
    if (!file || !filePath) {
      return res.status(404).json(asError(fileMessages.error.fileNotFound))
    }
    return res.download(filePath, file.name || id)
  } catch (err) {
    return res.status(500).json(asError((err as Error).message))
  }
}

async function deleteFileController(req: Request, res: Response) {
  const { id } = req.params
  try {
    await deleteFileService(id)
    return res.status(200).json(asMessage(fileMessages.success.fileDeleted))
  } catch (err) {
    const msg = (err as Error).message
    if (msg === fileMessages.error.fileNotFound) {
      return res.status(404).json(asError(msg))
    }
    return res.status(400).json(asError(msg))
  }
}

export {
  upsertFileController,
  getFileListController,
  getFileDetailsController,
  downloadFileController,
  deleteFileController,
}
