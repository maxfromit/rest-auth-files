import "dotenv/config"

export function getUploadDir(): string {
  const dir = process.env.UPLOAD_DIR
  if (!dir) {
    throw new Error("UPLOAD_DIR environment variable is not set")
  }
  return dir
}
