import { Router } from "express"
import {
  signupController,
  signinController,
  refreshAccessTokenController,
  logoutController,
} from "../controllers/authControllers.js"
import { authMiddleware } from "../middleware/authMiddleware.js"
import { REFRESH_TOKEN_COOKIE_PATH } from "../consts.js"

const router = Router()

router.post("/signup", signupController)
router.post("/signin", signinController)
router.post(REFRESH_TOKEN_COOKIE_PATH, refreshAccessTokenController)
router.post("/logout", authMiddleware, logoutController)

export default router
