import { db } from "../src/db/index.js"
import "dotenv/config"

async function listTables() {
  const [rows] = await db.execute("SHOW TABLES")
  console.log("Existing tables:", rows)
}

listTables().catch(console.error)
