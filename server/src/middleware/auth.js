import jwt from 'jsonwebtoken'
import User from '../models/User.js'

/**
 * Middleware to authenticate requests using a JSON Web Token in the Authorization header.
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No Bearer token provided.',
      })
    }

    const token = authHeader.split(' ')[1]
    const secret = process.env.JWT_SECRET

    if (!secret) {
      throw new Error('JWT_SECRET is not configured on the server.')
    }

    const decoded = jwt.verify(token, secret)
    const user = await User.findById(decoded.id)

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session. User account no longer exists.',
      })
    }

    req.user = user
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' })
    }
    return res.status(401).json({ success: false, message: 'Invalid authentication token.' })
  }
}

/**
 * Middleware to enforce role-based access control.
 * @param  {...string} roles Allowed roles (e.g. 'patient', 'doctor')
 */
export function authorizeRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. This operation requires one of the following roles: ${roles.join(', ')}.`,
      })
    }

    next()
  }
}
