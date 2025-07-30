// src/middleware/auth.middleware.ts

import type { Request, Response, NextFunction } from "express"
import { db } from "../db/index.js"
import { tokensTable } from "../db/schema.js"
import { eq } from "drizzle-orm"
import jwt from "jsonwebtoken"
import { authMessages, asError } from "../consts/messages.js"

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers["authorization"]

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json(asError(authMessages.error.missingAuthHeader))
  }

  const token = authHeader.split(" ")[1]

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string
      sessionId: string
    }
    if (!payload.id || !payload.sessionId) {
      return res.status(401).json(asError(authMessages.error.invalidPayload))
    }

    req.userId = payload.id
    req.sessionId = payload.sessionId

    // Check if session is revoked or expired
    const tokens = await db
      .select()
      .from(tokensTable)
      .where(eq(tokensTable.session_id, payload.sessionId))

    const tokenRow = tokens[0]
    if (!tokenRow || tokenRow.revoked_at) {
      return res.status(401).json(asError(authMessages.error.sessionRevoked))
    }
    if (tokenRow.expires_at < new Date()) {
      return res
        .status(401)
        .json(asError(authMessages.error.refreshTokenExpired))
    }

    next()
  } catch (err) {
    return res.status(401).json(asError((err as Error).message))
  }
}
