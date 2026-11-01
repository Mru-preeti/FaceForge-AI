import cors from 'cors'
import express from 'express'
import generationRoutes from './routes/generationRoutes.js'
import healthRoutes from './routes/healthRoutes.js'

const app = express()

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())
app.use('/api', healthRoutes)
app.use('/api', generationRoutes)

app.use((error, request, response, next) => {
  if (response.headersSent) {
    return next(error)
  }

  const statusCode = Number.isInteger(error.status) ? error.status : 500
  const message = statusCode >= 500 ? 'Internal server error' : error.message

  response.status(statusCode).json({
    success: false,
    message,
  })
})

export default app