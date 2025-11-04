import jwt from 'jsonwebtoken'
import User from '../models/User.js'

// Generate JWT token
export const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '15m' }
  )
}

// Generate refresh token
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  )
}

// Verify JWT token
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET)
}

// Verify refresh token
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET)
}

// Authentication middleware
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    try {
      const decoded = verifyToken(token)
      const user = await User.findById(decoded.userId).select('-password')

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token or user not found'
        })
      }

      // Update last login time
      await user.updateLastLogin()

      req.user = user
      next()
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired',
          code: 'TOKEN_EXPIRED'
        })
      }
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        })
      }
      throw jwtError
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    })
  }
}

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null
      return next()
    }

    const token = authHeader.substring(7)

    try {
      const decoded = verifyToken(token)
      const user = await User.findById(decoded.userId).select('-password')

      if (user && user.isActive) {
        req.user = user
      } else {
        req.user = null
      }
    } catch (jwtError) {
      // Ignore JWT errors for optional auth
      req.user = null
    }

    next()
  } catch (error) {
    req.user = null
    next()
  }
}

// Admin authentication middleware
export const authenticateAdmin = async (req, res, next) => {
  try {
    // First authenticate the user
    await new Promise((resolve, reject) => {
      authenticate(req, res, (err) => {
        if (err) return reject(err)
        resolve()
      })
    })

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      })
    }

    next()
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Admin authentication failed'
    })
  }
}

// Refresh token middleware
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required'
      })
    }

    try {
      const decoded = verifyRefreshToken(refreshToken)

      if (decoded.type !== 'refresh') {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        })
      }

      const user = await User.findById(decoded.userId).select('-password')

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token or user not found'
        })
      }

      // Generate new access token
      const newAccessToken = generateToken(user._id)

      req.user = user
      req.newAccessToken = newAccessToken
      next()
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Refresh token expired',
          code: 'REFRESH_TOKEN_EXPIRED'
        })
      }
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        })
      }
      throw jwtError
    }
  } catch (error) {
    console.error('Refresh token error:', error)
    return res.status(500).json({
      success: false,
      message: 'Token refresh failed'
    })
  }
}

// Rate limiting middleware for auth endpoints
export const authRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
}

export default {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  authenticate,
  optionalAuthenticate,
  authenticateAdmin,
  refreshToken,
  authRateLimit
}