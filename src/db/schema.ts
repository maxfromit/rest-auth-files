import { mysqlTable, int, varchar, timestamp } from "drizzle-orm/mysql-core"

export const usersTable = mysqlTable("users", {
  id: varchar("id", { length: 255 }).primaryKey().unique(), // phone or email as string as in test task
  password_hash: varchar("password_hash", { length: 255 }).notNull(),
  //id: int("id").primaryKey().autoincrement(),
  //email: varchar("email", { length: 255 }).unique().optional(),
  //phone: varchar("phone", { length: 20 }).unique().optional(),
  created_at: timestamp("created_at").defaultNow(),
})

export const filesTable = mysqlTable("files", {
  id: int("id").primaryKey().autoincrement(),
  user_id: int("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  extension: varchar("extension", { length: 10 }).notNull(),
  mime_type: varchar("mime_type", { length: 100 }).notNull(),
  size: int("size").notNull(),
  uploaded_at: timestamp("uploaded_at").defaultNow(),
})

export const tokensTable = mysqlTable("tokens", {
  id: int("id").primaryKey().autoincrement(),
  user_id: int("user_id").notNull(),
  refresh_token: varchar("refresh_token", { length: 255 }).notNull(),
  expires_at: timestamp("expires_at").notNull(),
  revoked: int("revoked").default(0),
})
