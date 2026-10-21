import mongoose from 'mongoose'

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 3000

/**
 * Connects to MongoDB. Non-blocking — the server starts regardless.
 * Retries up to MAX_RETRIES times before giving up gracefully.
 */
export async function connectDB(attempt = 1) {
  const uri = process.env.MONGODB_URI

  if (!uri) {
    console.warn('⚠️  MONGODB_URI not set — database features disabled.')
    return
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    })
    console.log('✅  MongoDB connected:', mongoose.connection.host)
  } catch (err) {
    console.error(`❌  MongoDB connection failed (attempt ${attempt}/${MAX_RETRIES}):`, err.message)

    if (attempt < MAX_RETRIES) {
      console.log(`    Retrying in ${RETRY_DELAY_MS / 1000}s …`)
      setTimeout(() => connectDB(attempt + 1), RETRY_DELAY_MS)
    } else {
      console.warn('    Max retries reached — running without database.')
    }
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected.')
  })
}
