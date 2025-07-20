import express from "express"
import cors from "cors"
import authRoutes from "./routes/authRoutes.js"
import infoRoutes from "./routes/infoRoutes.js"

const app = express()

app.use(cors())
app.use(express.json())

app.use("/", authRoutes)
app.use("/info", infoRoutes)

app.get("/health", (req, res) => {
  res.status(200).send("OK")
})

export default app
