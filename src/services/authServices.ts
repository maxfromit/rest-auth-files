import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import { randomUUID } from "crypto"
import { db } from "../db/index.js"
import { usersTable, tokensTable } from "../db/schema.js"
import { eq, and } from "drizzle-orm"
import {
  ACCESS_TOKEN_EXPIRE_MINUTES,
  REFRESH_TOKEN_EXPIRE_DAYS,
} from "../consts/tokenConfig.js"
import { authMessages } from "../consts/messages.js"

function generateAccessToken(id: string, sessionId: string) {
  return jwt.sign({ id, sessionId }, process.env.JWT_SECRET!, {
    expiresIn: `${ACCESS_TOKEN_EXPIRE_MINUTES}m`,
  })
}

function generateRefreshToken(id: string, sessionId: string) {
  return jwt.sign({ id, sessionId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: `${REFRESH_TOKEN_EXPIRE_DAYS}d`,
  })
}

function buildRefreshTokenRow(
  id: string,
  refreshToken: string,
  sessionId: string
) {
  return {
    user_id: id,
    refresh_token: refreshToken,
    session_id: sessionId,
    expires_at: new Date(
      Date.now() + REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60 * 1000
    ),
  }
}
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]
type Db = typeof db

type RevokeSessionTokenArgs =
  | {
      userId: string
      refreshToken: string
      sessionId?: never
      dbOrTx: Transaction | Db
    }
  | {
      userId: string
      sessionId: string
      refreshToken?: never
      dbOrTx: Transaction | Db
    }

async function revokeSessionToken(args: RevokeSessionTokenArgs) {
  const { userId, sessionId, refreshToken, dbOrTx } = args

  function getTokenWhereClause() {
    if (sessionId) return eq(tokensTable.session_id, sessionId)
    if (refreshToken) return eq(tokensTable.refresh_token, refreshToken)
    throw new Error(authMessages.error.missingSessionOrRefreshToken)
  }
  const result = await dbOrTx
    .update(tokensTable)
    .set({ revoked_at: new Date() })
    .where(and(eq(tokensTable.user_id, userId), getTokenWhereClause()))
  const resultHeader = Array.isArray(result) ? result[0] : result
  if (!resultHeader || resultHeader.affectedRows === 0)
    throw new Error(authMessages.error.sessionNotFoundOrRevoked)

  return resultHeader
}

async function signinService(id: string, password: string) {
  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .limit(1)
  const user = users[0]

  if (!user) throw new Error(authMessages.error.invalidUserId)

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) throw new Error(authMessages.error.invalidPassword)

  const sessionId = randomUUID()
  const accessToken = generateAccessToken(id, sessionId)
  const refreshToken = generateRefreshToken(id, sessionId)

  await db
    .insert(tokensTable)
    .values(buildRefreshTokenRow(id, refreshToken, sessionId))
  return { accessToken, refreshToken }
}

async function signupService(id: string, password: string) {
  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id))
  if (existing.length > 0) throw new Error(authMessages.error.userAlreadyExists)

  const password_hash = await bcrypt.hash(password, 12)
  const sessionId = randomUUID()
  const accessToken = generateAccessToken(id, sessionId)
  const refreshToken = generateRefreshToken(id, sessionId)

  await db.transaction(async (tx) => {
    await tx.insert(usersTable).values({ id, password_hash })
    await tx
      .insert(tokensTable)
      .values(buildRefreshTokenRow(id, refreshToken, sessionId))
  })
  return { accessToken, refreshToken }
}

async function rotateTokensService(refreshToken: string) {
  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!)

  const tokens = await db
    .select()
    .from(tokensTable)
    .where(eq(tokensTable.refresh_token, refreshToken))

  const tokenRow = tokens[0]

  if (!tokenRow || tokenRow.revoked_at)
    throw new Error(authMessages.error.invalidOrRevokedRefreshToken)

  if (tokenRow.expires_at < new Date())
    throw new Error(authMessages.error.refreshTokenExpired)

  const newSessionId = randomUUID()
  const newAccessToken = generateAccessToken(tokenRow.user_id, newSessionId)
  const newRefreshToken = generateRefreshToken(tokenRow.user_id, newSessionId)

  await db.transaction(async (tx) => {
    // Revoke old session token
    await revokeSessionToken({
      userId: tokenRow.user_id,
      refreshToken: tokenRow.refresh_token,
      dbOrTx: tx,
    })

    // Store new refresh token
    await tx
      .insert(tokensTable)
      .values(
        buildRefreshTokenRow(tokenRow.user_id, newRefreshToken, newSessionId)
      )
  })

  return { accessToken: newAccessToken, refreshToken: newRefreshToken }
}

async function logoutService(userId: string, sessionId: string) {
  await revokeSessionToken({ userId, sessionId, dbOrTx: db })
}

export { signupService, signinService, rotateTokensService, logoutService }
