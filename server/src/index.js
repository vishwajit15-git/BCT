import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import multer from 'multer'
import { connectDB } from './config/db.js'
import healthRouter from './routes/health.js'
import authRouter from './routes/auth.js'
import recordsRouter from './routes/records.js'
import accessRouter from './routes/access.js'
import auditRouter from './routes/audit.js'

// ── App Initialization ───────────────────────────────────────────────────────
const app = express()
const PORT = process.env.PORT || 5000

// ── Security & Utility Middleware ────────────────────────────────────────────
app.use(helmet())
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
)
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Root & API Directory Endpoints ───────────────────────────────────────────
const apiInfo = {
  service: 'MediChain Healthcare Blockchain API',
  status: 'Online',
  version: '1.0.0',
  frontendUrl: 'http://localhost:3000',
  network: 'Hardhat Localhost (Chain ID: 1337)',
  endpoints: {
    health: 'GET /api/health',
    auth: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      me: 'GET /api/auth/me',
    },
    records: {
      upload: 'POST /api/records',
      mine: 'GET /api/records/mine',
      getById: 'GET /api/records/:id',
      download: 'GET /api/records/:id/download',
      verify: 'POST /api/records/:id/verify',
    },
    access: 'GET /api/access/:recordId',
    audit: 'GET /api/audit/:recordId',
  },
  note: 'To use the graphical healthcare dashboard, open http://localhost:3000 in your browser.',
}

app.get('/', (_req, res) => res.json(apiInfo))
app.get('/api', (_req, res) => res.json(apiInfo))
app.get('/health', (_req, res) => res.redirect('/api/health'))

// ── Mount API Routes ─────────────────────────────────────────────────────────
app.use('/api', healthRouter)
app.use('/api/auth', authRouter)
app.use('/api/records', recordsRouter)
app.use('/api/access', accessRouter)
app.use('/api/audit', auditRouter)

// ── 404 Route Handler ────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route '${req.originalUrl}' not found on MediChain API.`,
    suggestion: 'Available endpoints: GET /api/health, POST /api/auth/login, POST /api/records. Frontend UI runs at http://localhost:3000',
  })
})

// ── Centralized Error Handler ────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('API Error:', err.message)

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds maximum allowed limit (10MB).',
      })
    }
    return res.status(400).json({ success: false, message: err.message })
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message)
    return res.status(400).json({ success: false, message: messages.join(', ') })
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    return res.status(400).json({
      success: false,
      message: `A record with this ${field} already exists.`,
    })
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  })
})

// ── Server Listen ────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`\n🚀  MediChain API running at http://localhost:${PORT}`)
  console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`)
  console.log(`   Frontend UI : http://localhost:3000`)

  await connectDB()
})

export default app
