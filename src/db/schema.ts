import { mysqlTable, int, varchar, timestamp } from "drizzle-orm/mysql-core"

export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  identifier: varchar("identifier", { length: 255 }).notNull().unique(), // email or phone
  password_hash: varchar("password_hash", { length: 255 }).notNull(),
  created_at: timestamp("created_at").defaultNow(),
})

export const files = mysqlTable("files", {
  id: int("id").primaryKey().autoincrement(),
  user_id: int("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  extension: varchar("extension", { length: 10 }).notNull(),
  mime_type: varchar("mime_type", { length: 100 }).notNull(),
  size: int("size").notNull(),
  uploaded_at: timestamp("uploaded_at").defaultNow(),
})

export const tokens = mysqlTable("tokens", {
  id: int("id").primaryKey().autoincrement(),
  user_id: int("user_id").notNull(),
  refresh_token: varchar("refresh_token", { length: 255 }).notNull(),
  expires_at: timestamp("expires_at").notNull(),
  revoked: int("revoked").default(0),
})
