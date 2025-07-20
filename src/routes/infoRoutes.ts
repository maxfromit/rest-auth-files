import { Router } from "express"
import { authMiddleware } from "../middleware/authMiddleware.js"

const router = Router()

router.get("/", authMiddleware, (req, res) => {
  res.status(200).json({ id: req.userId })
})

export default router
