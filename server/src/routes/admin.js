import express from 'express'
import { authenticateAdmin } from '../middleware/auth.js'
import { catchAsync, ValidationError } from '../middleware/errorHandler.js'

const router = express.Router()

// All admin routes require admin authentication
router.use(authenticateAdmin)

// GET /api/admin/stats - Get admin dashboard stats
router.get('/stats',
  catchAsync(async (req, res) => {
    const userCount = await User.countDocuments()
    const activeUserCount = await User.countDocuments({ isActive: true })
    const toolCount = await Tool.countDocuments()
    const activeToolCount = await Tool.countDocuments({ isActive: true })
    const projectCount = await Project.countDocuments()
    const completedProjectCount = await Project.countDocuments({ status: 'completed' })

    // Get recent activity
    const recentProjects = await Project.find()
      .populate('userId', 'name')
      .populate('toolId', 'name')
      .sort({ createdAt: -1 })
      .limit(5)

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)

    res.json({
      success: true,
      data: {
        stats: {
          users: {
            total: userCount,
            active: activeUserCount,
            inactive: userCount - activeUserCount
          },
          tools: {
            total: toolCount,
            active: activeToolCount,
            inactive: toolCount - activeToolCount
          },
          projects: {
            total: projectCount,
            completed: completedProjectCount,
            inProgress: projectCount - completedProjectCount
          }
        },
        recentActivity: {
          projects: recentProjects,
          users: recentUsers
        }
      }
    })
  })
)

// GET /api/admin/users - Get all users
router.get('/users',
  catchAsync(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      isActive,
      sort = 'createdAt',
      order = 'desc'
    } = req.query

    const skip = (page - 1) * limit

    const query = {}

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }

    if (role) {
      query.role = role
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true'
    }

    const sortObject = {}
    sortObject[sort] = order === 'desc' ? -1 : 1

    const users = await User.find(query)
      .select('-password')
      .sort(sortObject)
      .skip(skip)
      .limit(parseInt(limit))

    const total = await User.countDocuments(query)

    res.json({
      success: true,
      data: {
        users,
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

// PUT /api/admin/users/:id/role - Update user role
router.put('/users/:id/role',
  catchAsync(async (req, res) => {
    const { id } = req.params
    const { role } = req.body

    if (!['user', 'admin'].includes(role)) {
      throw new ValidationError('Invalid role. Must be user or admin')
    }

    const user = await User.findById(id)

    if (!user) {
      throw new NotFoundError('User')
    }

    // Prevent admin from changing their own role
    if (user._id.toString() === req.user._id.toString()) {
      throw new ValidationError('Cannot change your own role')
    }

    user.role = role
    await user.save()

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: {
        user: user.getPublicProfile()
      }
    })
  })
)

// PUT /api/admin/users/:id/status - Update user status
router.put('/users/:id/status',
  catchAsync(async (req, res) => {
    const { id } = req.params
    const { isActive } = req.body

    const user = await User.findById(id)

    if (!user) {
      throw new NotFoundError('User')
    }

    // Prevent admin from deactivating themselves
    if (user._id.toString() === req.user._id.toString()) {
      throw new ValidationError('Cannot change your own status')
    }

    user.isActive = isActive
    await user.save()

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        user: user.getPublicProfile()
      }
    })
  })
)

// DELETE /api/admin/users/:id - Delete user
router.delete('/users/:id',
  catchAsync(async (req, res) => {
    const { id } = req.params

    const user = await User.findById(id)

    if (!user) {
      throw new NotFoundError('User')
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      throw new ValidationError('Cannot delete your own account')
    }

    await User.findByIdAndDelete(id)

    res.json({
      success: true,
      message: 'User deleted successfully'
    })
  })
)

// GET /api/admin/tools - Get all tools (including inactive)
router.get('/tools',
  catchAsync(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      isActive,
      accessType,
      sort = 'createdAt',
      order = 'desc'
    } = req.query

    const skip = (page - 1) * limit

    const query = {}

    if (search) {
      query.$text = { $search: search }
    }

    if (category) {
      query.category = category
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true'
    }

    if (accessType) {
      query.accessType = accessType
    }

    const sortObject = {}
    sortObject[sort] = order === 'desc' ? -1 : 1

    const tools = await Tool.find(query)
      .populate('addedBy', 'name')
      .sort(sortObject)
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Tool.countDocuments(query)

    res.json({
      success: true,
      data: {
        tools,
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

// POST /api/admin/tools - Add new tool
router.post('/tools',
  [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Tool name must be between 2 and 100 characters'),
    body('description')
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage('Description must be between 10 and 500 characters'),
    body('category')
      .isIn(['security', 'network', 'data', 'compliance', 'performance', 'crypto', 'forensics', 'other'])
      .withMessage('Invalid category'),
    body('htmlPath')
      .trim()
      .notEmpty()
      .withMessage('HTML file path is required'),
    body('accessType')
      .isIn(['iframe', 'new-tab', 'integrated'])
      .withMessage('Invalid access type'),
  ],
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const {
      name,
      description,
      category,
      htmlPath,
      htmlContent,
      icon,
      accessType,
      tags,
      configuration
    } = req.body

    const tool = new Tool({
      name,
      description,
      category,
      htmlPath,
      htmlContent: htmlContent || null,
      icon: icon || '🔧',
      accessType,
      tags: tags || [],
      configuration: configuration || {},
      addedBy: req.user._id,
      isActive: true
    })

    await tool.save()

    const populatedTool = await Tool.findById(tool._id)
      .populate('addedBy', 'name')

    res.status(201).json({
      success: true,
      message: 'Tool added successfully',
      data: {
        tool: populatedTool
      }
    })
  })
)

export default router