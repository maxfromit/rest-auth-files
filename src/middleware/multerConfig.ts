import multer from "multer"
import { extname } from "path"
import { randomUUID } from "crypto"

import { getUploadDir } from "../utils/getUploadDir.js"

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      cb(null, getUploadDir())
    } catch (err) {
      cb(err as Error, "")
    }
  },
  filename: (req, file, cb) => {
    try {
      const id = req.params?.id || randomUUID() // preserve id for file updates
      const extension = extname(file.originalname)
      cb(null, `${id}${extension}`)
    } catch (err) {
      cb(err as Error, "")
    }
  },
})

export const multerConfig = multer({ storage })
