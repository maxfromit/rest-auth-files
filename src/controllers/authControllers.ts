import type { Request, Response } from "express"
import {
  signupService,
  signinService,
  refreshAccessTokenService,
  logoutService,
} from "../services/authServices.js"

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

      const result = await serviceFn(id, password)

      return res.status(successStatus).json({
        message: successMessage,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
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
    const { refreshToken } = req.body
    if (!refreshToken) {
      return res.status(400).json({ error: "Missing refresh token" })
    }
    const result = await refreshAccessTokenService(refreshToken)

    return res.status(200).json({
      message: "Access token refreshed",
      accessToken: result.accessToken,
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
