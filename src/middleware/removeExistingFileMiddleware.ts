import { deleteFileService } from "../services/fileServices.js"
import type { Request, Response, NextFunction } from "express"

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
    return res.status(400).json({ error: (err as Error).message })
  }
}
