import request from "supertest"
import app from "../app.js"
import type { User } from "./types.js"

export async function signup(user: User) {
  return request(app).post("/signup").send(user)
}

export async function signin(user: User) {
  return request(app).post("/signin").send(user)
}
