import { Router } from "express"
import {
  signupController,
  signinController,
  refreshAccessTokenController,
  logoutController,
} from "../controllers/authControllers.js"
import { authMiddleware } from "../middleware/authMiddleware.js"

const router = Router()

router.post("/signup", signupController)
router.post("/signin", signinController)
router.post("/signin/new_token", refreshAccessTokenController)
router.post("/logout", authMiddleware, logoutController)

export default router
