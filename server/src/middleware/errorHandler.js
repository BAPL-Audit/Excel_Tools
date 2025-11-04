import mongoose from 'mongoose'

// Custom error classes
export class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400)
    this.errors = errors
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403)
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409)
  }
}

// Handle Cast Errors (MongoDB)
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`
  return new AppError(message, 400)
}

// Handle Duplicate Fields (MongoDB)
const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg?.match(/(["'])(\\?.)*?\1/)?.[0]
  const message = `Duplicate field value: ${value}. Please use another value!`
  return new AppError(message, 400)
}

// Handle Validation Errors (MongoDB)
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => ({
    field: el.path,
    message: el.message
  }))
  const message = 'Invalid input data'
  return new ValidationError(message, errors)
}

// Handle JWT Errors
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401)

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401)

// Handle Multer Errors
const handleMulterError = (err) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new AppError('File too large. Please upload a smaller file.', 400)
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return new AppError('Too many files uploaded.', 400)
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return new AppError('Unexpected file field.', 400)
  }
  return new AppError(`File upload error: ${err.message}`, 400)
}

// Send development error
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    error: err,
    message: err.message,
    stack: err.stack,
    errors: err.errors || []
  })
}

// Send production error
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || []
    })
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err)

    res.status(500).json({
      success: false,
      message: 'Something went wrong!'
    })
  }
}

// Global error handling middleware
export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500
  err.status = err.status || 'error'

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res)
  } else {
    let error = { ...err }
    error.message = err.message

    // Handle specific error types
    if (error.name === 'CastError') error = handleCastErrorDB(error)
    if (error.code === 11000) error = handleDuplicateFieldsDB(error)
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error)
    if (error.name === 'JsonWebTokenError') error = handleJWTError()
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError()
    if (error.name === 'MulterError') error = handleMulterError(error)

    sendErrorProd(error, res)
  }
}

// 404 Not Found middleware
export const notFound = (req, res, next) => {
  const err = new NotFoundError(`Route ${req.originalUrl}`)
  next(err)
}

// Async error wrapper
export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next)
  }
}

export default {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  errorHandler,
  notFound,
  catchAsync
}