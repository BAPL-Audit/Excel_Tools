import express from 'express'
import { body, validationResult } from 'express-validator'
import { authenticate } from '../middleware/auth.js'
import { catchAsync, ValidationError, NotFoundError, ForbiddenError } from '../middleware/errorHandler.js'

const router = express.Router()

// All project routes require authentication
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

// GET /api/projects - Get user's projects
router.get('/',
  catchAsync(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      status,
      toolId,
      search,
      sort = 'updatedAt',
      order = 'desc'
    } = req.query

    const skip = (page - 1) * limit

    const query = {
      $or: [
        { userId: req.user._id },
        { 'sharedWith.userId': req.user._id }
      ],
      isTemplate: false
    }

    if (status) {
      query.status = status
    }

    if (toolId) {
      query.toolId = toolId
    }

    if (search) {
      query.$or = [
        ...query.$or,
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ]
    }

    const sortObject = {}
    sortObject[sort] = order === 'desc' ? -1 : 1

    const projects = await Project.find(query)
      .populate('toolId', 'name icon category')
      .populate('userId', 'name')
      .sort(sortObject)
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

// GET /api/projects/templates - Get project templates
router.get('/templates',
  catchAsync(async (req, res) => {
    const templates = await Project.find({
      $or: [
        { userId: req.user._id, isTemplate: true },
        { isTemplate: true, isPublic: true }
      ]
    })
      .populate('toolId', 'name icon category')
      .populate('userId', 'name')

    res.json({
      success: true,
      data: {
        templates
      }
    })
  })
)

// GET /api/projects/:id - Get specific project
router.get('/:id',
  catchAsync(async (req, res) => {
    const { id } = req.params

    const project = await Project.findById(id)
      .populate('toolId', 'name icon category htmlPath accessType')
      .populate('userId', 'name')
      .populate('timeline.user', 'name')
      .populate('notes.author', 'name')
      .populate('sharedWith.userId', 'name')

    if (!project) {
      throw new NotFoundError('Project')
    }

    // Check if user has access
    const isOwner = project.userId._id.toString() === req.user._id.toString()
    const isShared = project.sharedWith.some(
      share => share.userId._id.toString() === req.user._id.toString()
    )

    if (!isOwner && !isShared && req.user.role !== 'admin') {
      throw new ForbiddenError('Access denied')
    }

    res.json({
      success: true,
      data: {
        project
      }
    })
  })
)

// POST /api/projects - Create new project
router.post('/',
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
    const { name, description, toolId, configuration, inputData, tags, priority } = req.body

    // Verify tool exists and is active
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
      tags: tags || [],
      priority: priority || 'medium',
      status: 'draft'
    })

    await project.save()

    // Add to user's projects
    req.user.projects.push(project._id)
    await req.user.save()

    // Add timeline entry
    await project.addTimelineEntry(
      'created',
      `Project "${name}" created using ${tool.name}`,
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

// PUT /api/projects/:id - Update project
router.put('/:id',
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage('Project name must be between 2 and 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters'),
    body('status')
      .optional()
      .isIn(['draft', 'in-progress', 'completed', 'archived'])
      .withMessage('Invalid status'),
  ],
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { id } = req.params
    const updates = req.body

    const project = await Project.findById(id)

    if (!project) {
      throw new NotFoundError('Project')
    }

    // Check if user has permission to update
    const isOwner = project.userId.toString() === req.user._id.toString()
    const canEdit = project.sharedWith.some(
      share => share.userId.toString() === req.user._id.toString() && share.permission === 'edit'
    )

    if (!isOwner && !canEdit && req.user.role !== 'admin') {
      throw new ForbiddenError('Update access denied')
    }

    // Track changes for timeline
    const changes = []
    if (updates.name && updates.name !== project.name) {
      changes.push(`Name changed from "${project.name}" to "${updates.name}"`)
    }
    if (updates.status && updates.status !== project.status) {
      changes.push(`Status changed from "${project.status}" to "${updates.status}"`)
    }

    // Update project
    Object.assign(project, updates)
    await project.save()

    // Add timeline entries for changes
    for (const change of changes) {
      await project.addTimelineEntry('updated', change, req.user._id)
    }

    const updatedProject = await Project.findById(id)
      .populate('toolId', 'name icon category')
      .populate('userId', 'name')

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: {
        project: updatedProject
      }
    })
  })
)

// DELETE /api/projects/:id - Delete project
router.delete('/:id',
  catchAsync(async (req, res) => {
    const { id } = req.params

    const project = await Project.findById(id)

    if (!project) {
      throw new NotFoundError('Project')
    }

    // Check if user is owner or admin
    const isOwner = project.userId.toString() === req.user._id.toString()

    if (!isOwner && req.user.role !== 'admin') {
      throw new ForbiddenError('Delete access denied')
    }

    await Project.findByIdAndDelete(id)

    // Remove from user's projects
    req.user.projects = req.user.projects.filter(
      projectId => projectId.toString() !== id
    )
    await req.user.save()

    res.json({
      success: true,
      message: 'Project deleted successfully'
    })
  })
)

// POST /api/projects/:id/notes - Add note to project
router.post('/:id/notes',
  [
    body('content')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Note content must be between 1 and 1000 characters'),
  ],
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { id } = req.params
    const { content } = req.body

    const project = await Project.findById(id)

    if (!project) {
      throw new NotFoundError('Project')
    }

    // Check if user has access
    const isOwner = project.userId.toString() === req.user._id.toString()
    const hasAccess = project.sharedWith.some(
      share => share.userId.toString() === req.user._id.toString()
    )

    if (!isOwner && !hasAccess && req.user.role !== 'admin') {
      throw new ForbiddenError('Access denied')
    }

    await project.addNote(content, req.user._id)

    const updatedProject = await Project.findById(id)
      .populate('notes.author', 'name')

    const newNote = updatedProject.notes[updatedProject.notes.length - 1]

    res.status(201).json({
      success: true,
      message: 'Note added successfully',
      data: {
        note: newNote
      }
    })
  })
)

export default router