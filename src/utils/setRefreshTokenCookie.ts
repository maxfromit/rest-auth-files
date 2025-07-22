import type { Response } from "express"
import { REFRESH_TOKEN_COOKIE_PATH, REFRESH_TOKEN_MAX_AGE } from "../consts.js"

export function setRefreshTokenCookie(res: Response, refreshToken: string) {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: REFRESH_TOKEN_COOKIE_PATH,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  })
}
