import mongoose from 'mongoose'

const toolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tool name is required'],
    trim: true,
    maxlength: [100, 'Tool name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Tool description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Tool category is required'],
    enum: [
      'security',
      'network',
      'data',
      'compliance',
      'performance',
      'crypto',
      'forensics',
      'other'
    ],
    default: 'other'
  },
  htmlPath: {
    type: String,
    required: [true, 'HTML file path is required'],
    trim: true
  },
  htmlContent: {
    type: String, // For tools that store HTML directly in DB
    default: null
  },
  icon: {
    type: String,
    default: '🔧' // Default tool icon
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  accessType: {
    type: String,
    enum: ['iframe', 'new-tab', 'integrated'],
    default: 'iframe'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  requiredPermissions: [{
    type: String,
    enum: ['basic', 'advanced', 'admin'],
    default: 'basic'
  }],
  usageCount: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  ratingCount: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  version: {
    type: String,
    default: '1.0.0'
  },
  changelog: [{
    version: String,
    changes: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  screenshots: [{
    type: String // URLs to screenshots
  }],
  documentation: {
    type: String,
    default: ''
  },
  configuration: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes for better performance
toolSchema.index({ name: 'text', description: 'text', tags: 'text' })
toolSchema.index({ category: 1, isActive: 1 })
toolSchema.index({ addedBy: 1, createdAt: -1 })
toolSchema.index({ featured: 1, isActive: 1 })
toolSchema.index({ usageCount: -1 })
toolSchema.index({ averageRating: -1 })

// Virtual for tool's project count
toolSchema.virtual('projectCount', {
  ref: 'Project',
  localField: '_id',
  foreignField: 'toolId',
  count: true
})

// Virtual for tool's rating breakdown
toolSchema.virtual('ratingBreakdown', {
  ref: 'Rating',
  localField: '_id',
  foreignField: 'toolId'
})

// Method to increment usage count
toolSchema.methods.incrementUsage = function() {
  this.usageCount += 1
  return this.save()
}

// Method to update rating
toolSchema.methods.updateRating = function(newRating) {
  const totalRatings = this.ratingCount * this.averageRating + newRating
  this.ratingCount += 1
  this.averageRating = Math.round((totalRatings / this.ratingCount) * 10) / 10
  return this.save()
}

// Method to add changelog entry
toolSchema.methods.addChangelog = function(version, changes, userId) {
  this.changelog.push({
    version,
    changes,
    updatedBy: userId,
    updatedAt: new Date()
  })
  return this.save()
}

// Method to get tool summary
toolSchema.methods.getSummary = function() {
  return {
    _id: this._id,
    name: this.name,
    description: this.description,
    category: this.category,
    icon: this.icon,
    tags: this.tags,
    accessType: this.accessType,
    isActive: this.isActive,
    isPublic: this.isPublic,
    usageCount: this.usageCount,
    averageRating: this.averageRating,
    ratingCount: this.ratingCount,
    featured: this.featured,
    version: this.version,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  }
}

// Static method to get popular tools
toolSchema.statics.getPopularTools = function(limit = 10) {
  return this.find({ isActive: true, isPublic: true })
    .sort({ usageCount: -1, averageRating: -1 })
    .limit(limit)
    .populate('addedBy', 'name')
}

// Static method to get featured tools
toolSchema.statics.getFeaturedTools = function(limit = 6) {
  return this.find({ isActive: true, isPublic: true, featured: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('addedBy', 'name')
}

// Static method to search tools
toolSchema.statics.searchTools = function(query, options = {}) {
  const {
    category,
    accessType,
    minRating,
    limit = 20,
    skip = 0
  } = options

  const searchQuery = {
    isActive: true,
    isPublic: true
  }

  if (query) {
    searchQuery.$text = { $search: query }
  }

  if (category) {
    searchQuery.category = category
  }

  if (accessType) {
    searchQuery.accessType = accessType
  }

  if (minRating) {
    searchQuery.averageRating = { $gte: minRating }
  }

  return this.find(searchQuery)
    .sort(query ? { score: { $meta: 'textScore' } } : { averageRating: -1 })
    .skip(skip)
    .limit(limit)
    .populate('addedBy', 'name')
}

export default mongoose.model('Tool', toolSchema)