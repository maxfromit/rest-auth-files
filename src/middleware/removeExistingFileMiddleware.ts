import { deleteFileService } from "../services/fileServices.js"
import type { Request, Response, NextFunction } from "express"
import { asError, fileMessages } from "../consts/messages.js"

export async function removeExistingFileMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { id } = req.params
  try {
    await deleteFileService(id)
    next()
  } catch (err) {
    const msg = (err as Error).message
    if (
      msg === fileMessages.error.fileNotFound ||
      msg === fileMessages.error.fileMayNotExist
    ) {
      return res.status(404).json(asError(msg))
    }
    return res.status(500).json(asError(msg))
  }
}
