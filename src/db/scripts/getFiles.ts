import { db } from "../index.js"
import { filesTable } from "../schema.js"
import { desc } from "drizzle-orm"

async function getFiles() {
  console.log("getting files...")

  try {
    const filesWithTokens = await db
      .select()
      .from(filesTable)
      .orderBy(desc(filesTable.uploaded_at))
    console.log("Existing files:", filesWithTokens)
  } catch (err) {
    console.error("Error querying filesTable:", err)
    throw err
  }
}

getFiles()
