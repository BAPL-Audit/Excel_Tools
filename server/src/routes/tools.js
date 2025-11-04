import express from 'express'
import { authenticate, optionalAuthenticate } from '../middleware/auth.js'
import { catchAsync, NotFoundError } from '../middleware/errorHandler.js'

const router = express.Router()

// GET /api/tools - Get all available tools
router.get('/',
  optionalAuthenticate, // Optional authentication for public tools
  catchAsync(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      category,
      accessType,
      search,
      sort = 'name',
      order = 'asc'
    } = req.query

    const skip = (page - 1) * limit

    // Build query
    const query = {
      isActive: true,
      isPublic: true
    }

    if (category) {
      query.category = category
    }

    if (accessType) {
      query.accessType = accessType
    }

    if (search) {
      query.$text = { $search: search }
    }

    // Build sort object
    const sortObject = {}
    sortObject[sort] = order === 'desc' ? -1 : 1

    // If user is authenticated, include their usage data
    let tools
    if (req.user) {
      tools = await Tool.find(query)
        .populate('addedBy', 'name')
        .sort(sortObject)
        .skip(skip)
        .limit(parseInt(limit))
    } else {
      tools = await Tool.find(query)
        .select('-configuration -documentation') // Exclude sensitive fields for public access
        .populate('addedBy', 'name')
        .sort(sortObject)
        .skip(skip)
        .limit(parseInt(limit))
    }

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

// GET /api/tools/featured - Get featured tools
router.get('/featured',
  catchAsync(async (req, res) => {
    const limit = parseInt(req.query.limit) || 6

    const tools = await Tool.getFeaturedTools(limit)

    res.json({
      success: true,
      data: {
        tools
      }
    })
  })
)

// GET /api/tools/popular - Get popular tools
router.get('/popular',
  catchAsync(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10

    const tools = await Tool.getPopularTools(limit)

    res.json({
      success: true,
      data: {
        tools
      }
    })
  })
)

// GET /api/tools/categories - Get tool categories
router.get('/categories',
  catchAsync(async (req, res) => {
    const categories = await Tool.distinct('category', { isActive: true, isPublic: true })

    res.json({
      success: true,
      data: {
        categories
      }
    })
  })
)

// GET /api/tools/:id - Get specific tool details
router.get('/:id',
  optionalAuthenticate,
  catchAsync(async (req, res) => {
    const { id } = req.params

    const tool = await Tool.findById(id)
      .populate('addedBy', 'name')

    if (!tool || !tool.isActive || (!tool.isPublic && (!req.user || req.user.role !== 'admin'))) {
      throw new NotFoundError('Tool')
    }

    // Increment usage count if user is authenticated
    if (req.user) {
      await tool.incrementUsage()
    }

    res.json({
      success: true,
      data: {
        tool
      }
    })
  })
)

// POST /api/tools/:id/launch - Launch a tool
router.post('/:id/launch',
  authenticate,
  catchAsync(async (req, res) => {
    const { id } = req.params
    const user = req.user

    const tool = await Tool.findById(id)

    if (!tool || !tool.isActive) {
      throw new NotFoundError('Tool')
    }

    if (!tool.isPublic && user.role !== 'admin') {
      throw new NotFoundError('Tool')
    }

    // Increment usage count
    await tool.incrementUsage()

    // Determine launch URL based on access type
    let launchUrl
    switch (tool.accessType) {
      case 'iframe':
        launchUrl = `/tools/${tool.htmlPath}`
        break
      case 'new-tab':
        launchUrl = `/tools/${tool.htmlPath}`
        break
      case 'integrated':
        launchUrl = `/dashboard/tools/${id}`
        break
      default:
        launchUrl = `/tools/${tool.htmlPath}`
    }

    res.json({
      success: true,
      data: {
        tool: tool.getSummary(),
        launchUrl,
        accessType: tool.accessType
      }
    })
  })
)

export default router