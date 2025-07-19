import dotenv from "dotenv"
import dotenvExpand from "dotenv-expand"
import { defineConfig } from "drizzle-kit"

const env = dotenv.config()
dotenvExpand.expand(env)

console.log("Generating Drizzle configuration...", process.env.DATABASE_URL)

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
