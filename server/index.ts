import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import healthRouter from './routes/health.js'
import contactRouter from './routes/contact.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || (process.env.NODE_ENV === 'production' ? 3000 : 3001)

// Middleware
app.use(cors())
app.use(express.json())

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1)

// API routes
app.use(healthRouter)
app.use(contactRouter)

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist')
  app.use(express.static(distPath))

  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
