import 'dotenv/config'
import app from './app.js'

const port = Number.parseInt(process.env.PORT ?? '5000', 10)

app.listen(port, () => {
  console.log(`FaceForge AI backend listening on port ${port}`)
})