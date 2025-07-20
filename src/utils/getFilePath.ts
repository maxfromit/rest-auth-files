import { join } from "path"
import { getUploadDir } from "../utils/getUploadDir.js"

export function getFilePath(id: string, extension: string): string {
  return join(getUploadDir(), `${id}${extension}`)
}
