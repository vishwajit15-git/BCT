import jwt from 'jsonwebtoken'
import User from '../models/User.js'

function generateToken(user) {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not configured.')
  }
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      walletAddress: user.walletAddress,
    },
    secret,
    { expiresIn: '7d' }
  )
}

/**
 * POST /api/auth/register
 */
export async function register(req, res, next) {
  try {
    const { name, email, password, role, walletAddress, specialization, licenseNumber } = req.body

    // Basic input validation
    if (!name || !email || !password || !role || !walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, role, and walletAddress are required.',
      })
    }

    if (!['patient', 'doctor'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either "patient" or "doctor".',
      })
    }

    const cleanWallet = walletAddress.trim().toLowerCase()
    if (!/^0x[a-f0-9]{40}$/.test(cleanWallet)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Ethereum wallet address format (must be 0x followed by 40 hex characters).',
      })
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email: email.toLowerCase().trim() })
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      })
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      walletAddress: cleanWallet,
      specialization: specialization ? specialization.trim() : '',
      licenseNumber: licenseNumber ? licenseNumber.trim() : '',
    })

    const token = generateToken(user)

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: user.toSafeObject(),
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/auth/login
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password')
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      })
    }

    const token = generateToken(user)

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: user.toSafeObject(),
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/auth/me
 */
export async function getMe(req, res) {
  res.json({
    success: true,
    user: req.user.toSafeObject(),
  })
}

/**
 * POST /api/auth/demo-login
 * Seamless 1-click demo login for Patient or Doctor.
 */
export async function demoLogin(req, res, next) {
  try {
    const { role } = req.body
    const targetRole = role === 'doctor' ? 'doctor' : 'patient'

    const demoConfig =
      targetRole === 'doctor'
        ? {
            email: 'doctor.demo@medichain.org',
            name: 'Dr. Gregory House (Demo Doctor)',
            walletAddress: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
            specialization: 'Diagnostic Cardiology & Internal Medicine',
            licenseNumber: 'DOC-DEMO-2026',
          }
        : {
            email: 'patient.demo@medichain.org',
            name: 'Alice Smith (Demo Patient)',
            walletAddress: '0xbe5ac515cc005850653d4a4fd04641ce8f5edf64',
          }

    let user = await User.findOne({ email: demoConfig.email })
    if (!user) {
      user = await User.create({
        ...demoConfig,
        password: 'Password123!',
        role: targetRole,
      })
    } else {
      user.name = demoConfig.name
      user.walletAddress = demoConfig.walletAddress
      if (demoConfig.specialization) user.specialization = demoConfig.specialization
      if (demoConfig.licenseNumber) user.licenseNumber = demoConfig.licenseNumber
      await user.save()
    }

    const token = generateToken(user)

    res.json({
      success: true,
      message: `Logged in as Demo ${targetRole}.`,
      token,
      user: user.toSafeObject(),
    })
  } catch (err) {
    next(err)
  }
}
