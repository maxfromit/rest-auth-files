import { drizzle } from "drizzle-orm/mysql2"
import mysql from "mysql2/promise"
import dotenv from "dotenv"
import dotenvExpand from "dotenv-expand"

const env = dotenv.config()
dotenvExpand.expand(env)

const poolConnection = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: Number(process.env.MYSQL_TCP_PORT),
})

export const db = drizzle({ client: poolConnection })
