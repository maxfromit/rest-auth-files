import "dotenv/config"
import { db } from "./index.js"

async function testConnection() {
  console.log(
    "envs",
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    process.env.DB_NAME
  )
  try {
    // Try a simple query; for MySQL, you can use SELECT 1
    const result = await db.execute("SELECT 1")
    console.log("DB connection successful:", result)
  } catch (error) {
    console.error("DB connection failed:", error)
  }
}

testConnection()
