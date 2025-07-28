import { db } from "../index.js"
import { usersTable } from "../schema.js"

async function deleteAllUsers() {
  try {
    await db.delete(usersTable)
    console.log("All users deleted.")
  } catch (err) {
    console.error("Error deleting users:", err)
    throw err
  }
}

export { deleteAllUsers }
