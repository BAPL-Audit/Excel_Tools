import express from 'express'
import { body, validationResult } from 'express-validator'
import { authenticate } from '../middleware/auth.js'
import { catchAsync, ValidationError } from '../middleware/errorHandler.js'

const router = express.Router()

// All user routes require authentication
router.use(authenticate)

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

// GET /api/users/profile - Get current user profile
router.get('/profile',
  catchAsync(async (req, res) => {
    res.json({
      success: true,
      data: {
        user: req.user.getPublicProfile()
      }
    })
  })
)

// PUT /api/users/profile - Update current user profile
router.put('/profile',
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
  ],
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { name, email } = req.body
    const user = req.user

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() })
      if (existingUser) {
        throw new ValidationError('Email is already in use')
      }
      user.email = email.toLowerCase()
    }

    if (name) {
      user.name = name
    }

    await user.save()

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.getPublicProfile()
      }
    })
  })
)

// GET /api/users/projects - Get user's projects
router.get('/projects',
  catchAsync(async (req, res) => {
    const { page = 1, limit = 10, status, toolId } = req.query
    const skip = (page - 1) * limit

    const query = { userId: req.user._id }

    if (status) {
      query.status = status
    }

    if (toolId) {
      query.toolId = toolId
    }

    const projects = await Project.find(query)
      .populate('toolId', 'name icon category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Project.countDocuments(query)

    res.json({
      success: true,
      data: {
        projects,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  })
)

// POST /api/users/projects - Create new project
router.post('/projects',
  [
    body('name')
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage('Project name must be between 2 and 200 characters'),
    body('toolId')
      .isMongoId()
      .withMessage('Valid tool ID is required'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters'),
  ],
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { name, description, toolId, configuration, inputData } = req.body

    // Verify tool exists
    const tool = await Tool.findById(toolId)
    if (!tool || !tool.isActive) {
      throw new ValidationError('Invalid or inactive tool')
    }

    const project = new Project({
      name,
      description,
      userId: req.user._id,
      toolId,
      toolType: tool.name,
      configuration: configuration || {},
      inputData: inputData || {},
      status: 'draft'
    })

    await project.save()

    // Add to user's projects
    req.user.projects.push(project._id)
    await req.user.save()

    // Add timeline entry
    await project.addTimelineEntry(
      'created',
      `Project "${name}" created`,
      req.user._id
    )

    const populatedProject = await Project.findById(project._id)
      .populate('toolId', 'name icon category')

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: {
        project: populatedProject
      }
    })
  })
)

export default router