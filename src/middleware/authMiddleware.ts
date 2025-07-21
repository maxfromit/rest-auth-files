// src/middleware/auth.middleware.ts
import type { Request, Response, NextFunction } from "express"
import { db } from "../db/index.js"
import { tokensTable } from "../db/schema.js"
import { eq } from "drizzle-orm"
import jwt from "jsonwebtoken"

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers["authorization"]

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Missing or invalid Authorization header" })
  }

  const token = authHeader.split(" ")[1]
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string
      sessionId: string
    }
    req.userId = payload.id
    req.sessionId = payload.sessionId

    // Check if session is revoked
    const tokens = await db
      .select()
      .from(tokensTable)
      .where(eq(tokensTable.session_id, payload.sessionId))
    const tokenRow = tokens[0]
    if (!tokenRow || tokenRow.revoked_at) {
      return res.status(401).json({ error: "Session revoked" })
    }

    next()
  } catch (err) {
    return res.status(401).json({ error: (err as Error).message })
  }
}
