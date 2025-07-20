import { db } from "../db/index.js"
import { usersTable, tokensTable } from "../db/schema.js"
import bcrypt from "bcrypt"
import { eq, and } from "drizzle-orm"
import jwt from "jsonwebtoken"

const ACCESS_TOKEN_EXPIRE_MINUTES = 10
const REFRESH_TOKEN_EXPIRE_DAYS = 7

function generateAccessToken(id: string): string {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: `${ACCESS_TOKEN_EXPIRE_MINUTES}m`,
  })
}

function generateRefreshToken(id: string): string {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: `${REFRESH_TOKEN_EXPIRE_DAYS}d`,
  })
}

function buildRefreshTokenRow(
  id: string,
  refreshToken: string
): {
  user_id: string
  refresh_token: string
  expires_at: Date
  revoked: number
} {
  return {
    user_id: id,
    refresh_token: refreshToken,
    expires_at: new Date(
      Date.now() + REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60 * 1000
    ),
    revoked: 0,
  }
}

async function signinService(
  id: string,
  password: string
): Promise<{ error?: string; accessToken?: string; refreshToken?: string }> {
  let user
  try {
    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1)
    user = users[0]
  } catch (err) {
    return { error: "Database error during user lookup: " + err }
  }

  if (!user) {
    return { error: "Invalid user id" }
  }

  let valid: boolean
  try {
    valid = await bcrypt.compare(password, user.password_hash)
  } catch (err) {
    return { error: "Error comparing password: " + err }
  }
  if (!valid) {
    return { error: "Invalid password" }
  }

  const accessToken = generateAccessToken(id)
  const refreshToken = generateRefreshToken(id)

  try {
    await db.insert(tokensTable).values(buildRefreshTokenRow(id, refreshToken))
    return { accessToken, refreshToken }
  } catch (err) {
    return { error: "Error storing refresh token: " + err }
  }
}

async function signupService(
  id: string,
  password: string
): Promise<{ error?: string; accessToken?: string; refreshToken?: string }> {
  let existing
  try {
    existing = await db.select().from(usersTable).where(eq(usersTable.id, id))
  } catch (err) {
    return { error: "Database error during user lookup: " + err }
  }

  if (existing.length > 0) {
    return { error: "User already exists" }
  }

  let password_hash: string
  try {
    password_hash = await bcrypt.hash(password, 12)
  } catch (err) {
    return { error: "Error hashing password: " + err }
  }

  const accessToken = generateAccessToken(id)
  const refreshToken = generateRefreshToken(id)

  try {
    await db.transaction(async (tx) => {
      try {
        await tx.insert(usersTable).values({ id, password_hash })
      } catch (err) {
        console.error("User insert error:", err)
        throw new Error("Error while inserting user")
      }
      try {
        await tx
          .insert(tokensTable)
          .values(buildRefreshTokenRow(id, refreshToken))
      } catch (err) {
        console.error("Token insert error:", err)
        throw new Error("Error while inserting token")
      }
    })
    return { accessToken, refreshToken }
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}

async function refreshAccessTokenService(
  refreshToken: string
): Promise<{ error?: string; accessToken?: string }> {
  let tokenRow
  try {
    const tokens = await db
      .select()
      .from(tokensTable)
      .where(eq(tokensTable.refresh_token, refreshToken))
    tokenRow = tokens[0]
  } catch (err) {
    return { error: "Database error during token lookup: " + err }
  }

  if (!tokenRow || tokenRow.revoked_at) {
    return { error: "Invalid or revoked refresh token" }
  }

  // Optionally, check expiration
  if (tokenRow.expires_at < new Date()) {
    return { error: "Refresh token expired" }
  }

  // Verify JWT
  try {
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!)
  } catch (err) {
    return { error: "Invalid refresh token" }
  }

  const accessToken = generateAccessToken(tokenRow.user_id)
  return { accessToken }
}

async function logoutService(
  refreshToken: string,
  userId: string
): Promise<{ error?: string }> {
  try {
    const result = await db
      .update(tokensTable)
      .set({ revoked_at: new Date() })
      .where(
        and(
          eq(tokensTable.refresh_token, refreshToken),
          eq(tokensTable.user_id, userId)
        )
      )

    const resultHeader = Array.isArray(result) ? result[0] : result

    if (!resultHeader || resultHeader.affectedRows === 0) {
      return { error: "Refresh token not found or already revoked" }
    }
    return {}
  } catch (err) {
    return { error: "Logout failed: " + String(err) }
  }
}

export {
  signupService,
  signinService,
  refreshAccessTokenService,
  logoutService,
}
