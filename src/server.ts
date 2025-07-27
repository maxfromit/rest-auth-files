import app from "./app.js"
import dotenv from "dotenv"
import dotenvExpand from "dotenv-expand"

const env = dotenv.config()
dotenvExpand.expand(env)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
