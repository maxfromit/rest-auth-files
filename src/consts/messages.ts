// Grouped plain string messages
const errorKey = "error"
const messageKey = "message"

const authMessages = {
  success: {
    logoutSuccessful: "Logged out successfully",
    signupSuccessful: "User registered successfully",
    loginSuccessful: "Login successful",
    accessTokenRefreshed: "Access token refreshed",
  },
  error: {
    missingAuthHeader: "Missing or Invalid Authorization header",
    missingAuthData: "Missing id or password",
    invalidUserId: "Invalid user id",
    invalidPassword: "Invalid password",
    userAlreadyExists: "User already exists",
    sessionNotFoundOrRevoked: "Session not found or already revoked",
    sessionRevoked: "Session revoked",
    invalidOrRevokedRefreshToken: "Invalid or revoked refresh token",
    refreshTokenExpired: "Refresh token expired",
    missingSessionOrRefreshToken:
      "Either sessionId or refreshToken must be provided",
    missingRefreshToken: "Missing refresh token",
    invalidPayload: "JWT payload is invalid",
  },
}

const fileMessages = {
  success: {
    fileDeleted: "File deleted successfully",
  },
  error: {
    noFileUploaded: "No file uploaded",
    fileNotFound: "File not found",
    fileMayNotExist: "File may not exist",
  },
}

const JWTtokenErrors = {
  invalidToken: "invalid token",
  invalidSignature: "invalid signature",
  expired: "jwt expired",
  malformed: "jwt malformed",
}

function asError(msg: string) {
  return { [errorKey]: msg }
}
function asMessage(msg: string) {
  return { [messageKey]: msg }
}
export {
  authMessages,
  fileMessages,
  JWTtokenErrors,
  asError,
  asMessage,
  errorKey,
  messageKey,
}
