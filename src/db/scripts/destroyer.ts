import { db } from "../index.js"

async function destroyTables() {
  await db.execute("DROP TABLE IF EXISTS tokens")
  await db.execute("DROP TABLE IF EXISTS files")
  await db.execute("DROP TABLE IF EXISTS users")
  console.log("tables droped")
}

destroyTables().catch(console.error)
