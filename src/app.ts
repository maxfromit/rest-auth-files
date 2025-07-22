import express from "express"
import cors from "cors"
import authRoutes from "./routes/authRoutes.js"
import infoRoutes from "./routes/infoRoutes.js"
import fileRoutes from "./routes/fileRoutes.js"
import cookieParser from "cookie-parser"

const app = express()
app.use(cookieParser())

app.use(cors())
app.use(express.json())

app.use("/", authRoutes)
app.use("/info", infoRoutes)
app.use("/file", fileRoutes)

export default app
