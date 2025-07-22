import { db } from "../index.js"
import { usersTable, tokensTable } from "../schema.js"
import { eq } from "drizzle-orm"

async function getUsers() {
  console.log("getting users...")

  try {
    const usersWithTokens = await db
      .select()
      .from(usersTable)
      .leftJoin(tokensTable, eq(usersTable.id, tokensTable.user_id))
    console.log("Existing users:", usersWithTokens)
  } catch (err) {
    console.error("Error querying usersTable:", err)
    throw err
  }
}

getUsers()
