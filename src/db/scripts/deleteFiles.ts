import { db } from "../index.js"
import { filesTable } from "../schema.js"

async function deleteAllFiles() {
  try {
    await db.delete(filesTable)
    console.log("All files deleted.")
  } catch (err) {
    console.error("Error deleting files:", err)
    throw err
  }
}

export { deleteAllFiles }
