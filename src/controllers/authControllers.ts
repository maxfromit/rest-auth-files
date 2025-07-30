import type { Request, Response } from "express"
import {
  signupService,
  signinService,
  rotateTokensService,
  logoutService,
} from "../services/authServices.js"
import { setRefreshTokenCookie } from "../utils/setRefreshTokenCookie.js"
import { authMessages, asError, asMessage } from "../consts/messages.js"
import { AuthenticatedRequest } from "../types.js"
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
        return res.status(400).json(asError(authMessages.error.missingAuthData))
      }

      const { accessToken, refreshToken } = await serviceFn(id, password)

      // Set refresh token as HTTP-only cookie
      if (refreshToken) {
        setRefreshTokenCookie(res, refreshToken)
      }

      return res.status(successStatus).json({
        ...asMessage(successMessage),
        accessToken: accessToken,
      })
    } catch (err) {
      return res.status(500).json(asError((err as Error).message))
    }
  }
}

const signupController = handleAuthResponse(
  signupService,
  201,
  authMessages.success.signupSuccessful
)

const signinController = handleAuthResponse(
  signinService,
  200,
  authMessages.success.loginSuccessful
)

async function refreshAccessTokenController(req: Request, res: Response) {
  try {
    const refreshToken = req.cookies.refreshToken
    if (!refreshToken) {
      return res
        .status(400)
        .json(asError(authMessages.error.missingRefreshToken))
    }
    const { accessToken, refreshToken: newRefreshToken } =
      await rotateTokensService(refreshToken)

    setRefreshTokenCookie(res, newRefreshToken)

    return res.status(200).json({
      ...asMessage(authMessages.success.accessTokenRefreshed),
      accessToken,
    })
  } catch (err) {
    if (
      (err as Error).message === authMessages.error.refreshTokenExpired ||
      (err as Error).message === authMessages.error.invalidOrRevokedRefreshToken
    ) {
      return res.status(401).json(asError((err as Error).message))
    }
    return res.status(500).json(asError((err as Error).message))
  }
}

async function logoutController(req: Request, res: Response) {
  const { userId, sessionId } = req as AuthenticatedRequest
  try {
    await logoutService(userId, sessionId)
    return res
      .status(200)
      .json(asMessage(authMessages.success.logoutSuccessful))
  } catch (err) {
    return res.status(500).json(asError((err as Error).message))
  }
}

export {
  signupController,
  signinController,
  refreshAccessTokenController,
  logoutController,
}
