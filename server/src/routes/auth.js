import express from 'express'
import { body, validationResult } from 'express-validator'
import rateLimit from 'express-rate-limit'
import User from '../models/User.js'
import {
  generateToken,
  generateRefreshToken,
  authenticate,
  refreshToken as refreshAccessToken,
  authRateLimit
} from '../middleware/auth.js'
import { catchAsync, ValidationError, UnauthorizedError } from '../middleware/errorHandler.js'

const router = express.Router()

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const validationErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg
    }))
    throw new ValidationError('Validation failed', validationErrors)
  }
  next()
}

// Rate limiting for sensitive endpoints
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 registration attempts per hour
  message: 'Too many registration attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

// POST /api/auth/register - Register a new user
router.post('/register',
  registerRateLimit,
  [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  ],
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { name, email, password } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      throw new ValidationError('User with this email already exists')
    }

    // Create new user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      emailVerified: false // In production, you'd send a verification email
    })

    await user.save()

    // Generate tokens
    const token = generateToken(user._id)
    const refreshToken = generateRefreshToken(user._id)

    // Don't include password in response
    const userResponse = user.getPublicProfile()

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token,
        refreshToken
      }
    })
  })
)

// POST /api/auth/login - Login user
router.post('/login',
  loginRateLimit,
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { email, password } = req.body

    // Find user with password
    const user = await User.findByEmailWithPassword(email.toLowerCase())

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid email or password')
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password')
    }

    // Generate tokens
    const token = generateToken(user._id)
    const refreshToken = generateRefreshToken(user._id)

    // Update last login
    await user.updateLastLogin()

    // Don't include password in response
    const userResponse = user.getPublicProfile()

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token,
        refreshToken
      }
    })
  })
)

// POST /api/auth/refresh - Refresh access token
router.post('/refresh',
  refreshAccessToken,
  catchAsync(async (req, res) => {
    const { newAccessToken } = req
    const user = req.user

    // Generate new refresh token
    const newRefreshToken = generateRefreshToken(user._id)

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newAccessToken,
        refreshToken: newRefreshToken,
        user: user.getPublicProfile()
      }
    })
  })
)

// POST /api/auth/logout - Logout user
router.post('/logout',
  authenticate,
  catchAsync(async (req, res) => {
    // In a production environment, you might want to:
    // 1. Add the token to a blacklist
    // 2. Remove the refresh token from the user's valid tokens
    // 3. Clear any server-side sessions

    res.json({
      success: true,
      message: 'Logout successful'
    })
  })
)

// GET /api/auth/me - Get current user
router.get('/me',
  authenticate,
  catchAsync(async (req, res) => {
    res.json({
      success: true,
      data: {
        user: req.user.getPublicProfile()
      }
    })
  })
)

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password',
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // limit each IP to 3 requests per windowMs
    message: 'Too many password reset requests, please try again later.',
  }),
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
  ],
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { email } = req.body

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      // Don't reveal if user exists or not
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset email has been sent'
      })
    }

    // In production, you would:
    // 1. Generate a reset token
    // 2. Save it to the user's record with expiration
    // 3. Send an email with reset link

    // For now, we'll just return a success message
    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset email has been sent'
    })
  })
)

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password',
  [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  ],
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { token, password } = req.body

    // In production, you would:
    // 1. Verify the reset token and expiration
    // 2. Find the user by token
    // 3. Update the password
    // 4. Clear the reset token

    // For now, we'll just return a success message
    res.json({
      success: true,
      message: 'Password reset successfully'
    })
  })
)

// OAuth routes would be implemented here
// These are placeholders for Google and GitHub OAuth

// GET /api/auth/google - Initiate Google OAuth
router.get('/google', (req, res) => {
  // In production, this would redirect to Google's OAuth consent screen
  res.json({
    success: true,
    message: 'Google OAuth not implemented yet'
  })
})

// GET /api/auth/google/callback - Handle Google OAuth callback
router.get('/google/callback', (req, res) => {
  // In production, this would handle the OAuth callback from Google
  res.json({
    success: true,
    message: 'Google OAuth callback not implemented yet'
  })
})

// GET /api/auth/github - Initiate GitHub OAuth
router.get('/github', (req, res) => {
  // In production, this would redirect to GitHub's OAuth consent screen
  res.json({
    success: true,
    message: 'GitHub OAuth not implemented yet'
  })
})

// GET /api/auth/github/callback - Handle GitHub OAuth callback
router.get('/github/callback', (req, res) => {
  // In production, this would handle the OAuth callback from GitHub
  res.json({
    success: true,
    message: 'GitHub OAuth callback not implemented yet'
  })
})

export default router