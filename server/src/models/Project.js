import mongoose from 'mongoose'

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [200, 'Project name cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tool',
    required: true
  },
  toolType: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'in-progress', 'completed', 'archived'],
    default: 'draft'
  },
  results: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  inputData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  configuration: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  dueDate: Date,
  estimatedDuration: Number, // in minutes
  actualDuration: Number, // in minutes
  screenshots: [{
    type: String,
    description: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimeType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  notes: [{
    content: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  timeline: [{
    action: {
      type: String,
      required: true
    },
    description: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    metadata: mongoose.Schema.Types.Mixed
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['view', 'edit'],
      default: 'view'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    },
    sharedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: null
  },
  feedback: {
    type: String,
    maxlength: [500, 'Feedback cannot exceed 500 characters']
  },
  isTemplate: {
    type: Boolean,
    default: false
  },
  templateName: String,
  templateDescription: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes for better performance
projectSchema.index({ userId: 1, createdAt: -1 })
projectSchema.index({ toolId: 1, createdAt: -1 })
projectSchema.index({ status: 1, createdAt: -1 })
projectSchema.index({ isTemplate: 1 })
projectSchema.index({ tags: 1 })
projectSchema.index({ priority: 1, dueDate: 1 })

// Virtual for project duration
projectSchema.virtual('duration').get(function() {
  if (this.actualDuration) return this.actualDuration
  if (this.createdAt && this.updatedAt) {
    return Math.round((this.updatedAt - this.createdAt) / 60000) // minutes
  }
  return 0
})

// Virtual for project age
projectSchema.virtual('age').get(function() {
  return Math.round((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24)) // days
})

// Method to add timeline entry
projectSchema.methods.addTimelineEntry = function(action, description, userId, metadata = {}) {
  this.timeline.push({
    action,
    description,
    user: userId,
    timestamp: new Date(),
    metadata
  })
  return this.save()
}

// Method to add note
projectSchema.methods.addNote = function(content, authorId) {
  this.notes.push({
    content,
    author: authorId,
    createdAt: new Date(),
    updatedAt: new Date()
  })
  return this.save()
}

// Method to add attachment
projectSchema.methods.addAttachment = function(attachmentData) {
  this.attachments.push({
    ...attachmentData,
    uploadedAt: new Date()
  })
  return this.save()
}

// Method to add screenshot
projectSchema.methods.addScreenshot = function(screenshotPath, description = '') {
  this.screenshots.push({
    path: screenshotPath,
    description,
    timestamp: new Date()
  })
  return this.save()
}

// Method to share project with user
projectSchema.methods.shareWithUser = function(userId, permission, sharedByUserId) {
  // Check if already shared
  const existingShare = this.sharedWith.find(
    share => share.userId.toString() === userId.toString()
  )

  if (existingShare) {
    existingShare.permission = permission
    existingShare.sharedBy = sharedByUserId
    existingShare.sharedAt = new Date()
  } else {
    this.sharedWith.push({
      userId,
      permission,
      sharedBy: sharedByUserId,
      sharedAt: new Date()
    })
  }

  return this.save()
}

// Method to create template from project
projectSchema.methods.createTemplate = function(templateName, templateDescription) {
  const template = new this.constructor({
    name: this.name,
    description: this.description,
    toolId: this.toolId,
    toolType: this.toolType,
    configuration: this.configuration,
    tags: this.tags,
    isTemplate: true,
    templateName: templateName || this.name,
    templateDescription: templateDescription || this.description,
    userId: this.userId
  })

  return template.save()
}

// Method to get project summary
projectSchema.methods.getSummary = function() {
  return {
    _id: this._id,
    name: this.name,
    description: this.description,
    status: this.status,
    toolType: this.toolType,
    tags: this.tags,
    priority: this.priority,
    dueDate: this.dueDate,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    duration: this.duration,
    age: this.age,
    rating: this.rating
  }
}

// Static method to get user's recent projects
projectSchema.statics.getUserRecentProjects = function(userId, limit = 10) {
  return this.find({ userId, isTemplate: false })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .populate('toolId', 'name icon category')
    .populate('userId', 'name')
}

// Static method to get user's project statistics
projectSchema.statics.getUserProjectStats = function(userId) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), isTemplate: false } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgRating: { $avg: '$rating' },
        totalDuration: { $sum: '$actualDuration' }
      }
    }
  ])
}

// Static method to search projects
projectSchema.statics.searchProjects = function(userId, query, options = {}) {
  const {
    status,
    toolId,
    tags,
    limit = 20,
    skip = 0
  } = options

  const searchQuery = {
    $or: [
      { userId: userId },
      { 'sharedWith.userId': userId }
    ],
    isTemplate: false
  }

  if (query) {
    searchQuery.$or = [
      ...searchQuery.$or,
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ]
  }

  if (status) {
    searchQuery.status = status
  }

  if (toolId) {
    searchQuery.toolId = toolId
  }

  if (tags && tags.length > 0) {
    searchQuery.tags = { $in: tags }
  }

  return this.find(searchQuery)
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('toolId', 'name icon category')
    .populate('userId', 'name')
}

export default mongoose.model('Project', projectSchema)