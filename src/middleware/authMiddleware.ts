// src/middleware/auth.middleware.ts
import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"

export function authMiddleware(
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
  console.log("Extracted token:", token)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: string }
    req.userId = payload.id
    next()
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" })
  }
}
