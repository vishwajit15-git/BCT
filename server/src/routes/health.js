import { Router } from 'express'
import mongoose from 'mongoose'

const router = Router()

/**
 * GET /api/health
 * Returns service uptime and MongoDB connection status.
 */
router.get('/health', (_req, res) => {
  const dbState = mongoose.connection.readyState
  const dbStatus = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] ?? 'unknown'

  res.json({
    success: true,
    service: 'medichain-api',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    database: dbStatus,
    version: process.env.npm_package_version || '1.0.0',
  })
})

export default router
