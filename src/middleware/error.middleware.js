import { errorResponse } from '../utils/response.js';
import { HTTP_STATUS, MONGO_ERRORS } from '../utils/constants.js';

/**
 * Global error handler middleware
 * Catches all errors and returns standardized response
 */
export const errorHandler = (err, req, res, next) => {
  // Log error for debugging (Morgan handles request logging, this is for errors)
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // Default error values
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message || 'Internal server error';
  let errorDetails = null;

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Validation failed';
    errorDetails = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
  }

  // Handle Mongoose duplicate key error
  if (err.code === MONGO_ERRORS.DUPLICATE_KEY) {
    statusCode = HTTP_STATUS.CONFLICT;
    const field = Object.keys(err.keyPattern)[0];
    message = `${field} already exists`;
  }

  // Handle Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Handle JWT errors (caught in auth middleware but just in case)
  if (err.name === 'JsonWebTokenError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Token expired';
  }

  // Send error response
  return errorResponse(res, message, statusCode, errorDetails);
};

/**
 * Async handler wrapper to avoid try-catch in controllers
 * Automatically catches errors and passes to errorHandler
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 handler for routes not found
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = HTTP_STATUS.NOT_FOUND;
  next(error);
};