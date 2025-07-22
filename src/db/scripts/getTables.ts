import { db } from "../index.js"

async function listTables() {
  const [rows] = await db.execute("SHOW TABLES")
  console.log("Existing tables:", rows)
}

listTables().catch(console.error)
