import express from "express"
import cors from "cors"

const app = express()

app.use(cors())
app.use(express.json())

app.get("/health", (req, res) => {
  res.status(200).send("OK")
})

export default app
