import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import { db } from "../db/index.js"
import { usersTable, tokensTable } from "../db/schema.js"
import { eq, and } from "drizzle-orm"

const ACCESS_TOKEN_EXPIRE_MINUTES = 1000
const REFRESH_TOKEN_EXPIRE_DAYS = 7

function generateAccessToken(id: string) {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: `${ACCESS_TOKEN_EXPIRE_MINUTES}m`,
  })
}

function generateRefreshToken(id: string) {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: `${REFRESH_TOKEN_EXPIRE_DAYS}d`,
  })
}

function buildRefreshTokenRow(id: string, refreshToken: string) {
  return {
    user_id: id,
    refresh_token: refreshToken,
    expires_at: new Date(
      Date.now() + REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60 * 1000
    ),
  }
}

async function signinService(id: string, password: string) {
  let user

  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .limit(1)
  user = users[0]

  if (!user) {
    throw new Error("Invalid user id")
  }
  let valid: boolean
  valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    throw new Error("Invalid password")
  }

  const accessToken = generateAccessToken(id)
  const refreshToken = generateRefreshToken(id)

  await db.insert(tokensTable).values(buildRefreshTokenRow(id, refreshToken))
  return { accessToken, refreshToken }
}

async function signupService(id: string, password: string) {
  let existing
  existing = await db.select().from(usersTable).where(eq(usersTable.id, id))

  if (existing.length > 0) {
    throw new Error("User already exists")
  }

  let password_hash: string
  password_hash = await bcrypt.hash(password, 12)

  const accessToken = generateAccessToken(id)
  const refreshToken = generateRefreshToken(id)

  await db.transaction(async (tx) => {
    await tx.insert(usersTable).values({ id, password_hash })
    await tx.insert(tokensTable).values(buildRefreshTokenRow(id, refreshToken))
  })
  return { accessToken, refreshToken }
}

async function refreshAccessTokenService(refreshToken: string) {
  let tokenRow
  const tokens = await db
    .select()
    .from(tokensTable)
    .where(eq(tokensTable.refresh_token, refreshToken))
  tokenRow = tokens[0]

  if (!tokenRow || tokenRow.revoked_at) {
    throw new Error("Invalid or revoked refresh token")
  }

  if (tokenRow.expires_at < new Date()) {
    throw new Error("Refresh token expired")
  }
  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!)

  const accessToken = generateAccessToken(tokenRow.user_id)
  return { accessToken }
}

async function logoutService(refreshToken: string, userId: string) {
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
    throw new Error("Refresh token not found or already revoked")
  }
}

export {
  signupService,
  signinService,
  refreshAccessTokenService,
  logoutService,
}
