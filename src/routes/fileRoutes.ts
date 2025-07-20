import { Router } from "express"
import { authMiddleware } from "../middleware/authMiddleware.js"
import { multerConfig } from "../middleware/multerConfig.js"
import { removeExistingFileMiddleware } from "../middleware/removeExistingFileMiddleware.js"
import {
  upsertFileController,
  getFileListController,
  getFileDetailsController,
  downloadFileController,
  deleteFileController,
} from "../controllers/fileControllers.js"

const router = Router()

router.post(
  "/upload",
  authMiddleware,
  multerConfig.single("file"),
  upsertFileController
)
router.get("/list", authMiddleware, getFileListController)

router.get("/:id", authMiddleware, getFileDetailsController)

router.get("/download/:id", authMiddleware, downloadFileController)

router.delete("/delete/:id", authMiddleware, deleteFileController)

router.put(
  "/update/:id",
  authMiddleware,
  removeExistingFileMiddleware,
  multerConfig.single("file"),
  upsertFileController
)

export default router
