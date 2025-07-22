import type { Request, Response } from "express"
import {
  signupService,
  signinService,
  rotateTokensService,
  logoutService,
} from "../services/authServices.js"
import { setRefreshTokenCookie } from "../utils/setRefreshTokenCookie.js"

function handleAuthResponse(
  serviceFn: (
    id: string,
    password: string
  ) => Promise<{ error?: string; accessToken?: string; refreshToken?: string }>,
  successStatus: number,
  successMessage: string
) {
  return async (req: Request, res: Response) => {
    try {
      const { id, password } = req.body
      if (!id || !password) {
        return res.status(400).json({ error: "Missing id or password" })
      }

      const { accessToken, refreshToken } = await serviceFn(id, password)

      // Set refresh token as HTTP-only cookie
      if (refreshToken) {
        setRefreshTokenCookie(res, refreshToken)
      }

      return res.status(successStatus).json({
        message: successMessage,
        accessToken: accessToken,
      })
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message })
    }
  }
}

const signupController = handleAuthResponse(
  signupService,
  201,
  "User registered successfully"
)

const signinController = handleAuthResponse(
  signinService,
  200,
  "Login successful"
)

async function refreshAccessTokenController(req: Request, res: Response) {
  try {
    // Use refresh token from HTTP-only cookie
    const refreshToken = req.cookies.refreshToken
    if (!refreshToken) {
      return res.status(400).json({ error: "Missing refresh token" })
    }
    const { accessToken, refreshToken: newRefreshToken } =
      await rotateTokensService(refreshToken)

    setRefreshTokenCookie(res, newRefreshToken)

    return res.status(200).json({
      message: "Access token refreshed",
      accessToken,
    })
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message })
  }
}

async function logoutController(req: Request, res: Response) {
  if (!req.userId || !req.sessionId) {
    return res.status(401).json({ error: "Unauthorized" })
  }
  try {
    await logoutService(req.userId, req.sessionId)
    return res.status(200).json({ message: "Logged out successfully" })
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message })
  }
}

export {
  signupController,
  signinController,
  refreshAccessTokenController,
  logoutController,
}
