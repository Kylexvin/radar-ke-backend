/**
 * Standardized API response helpers
 * RADA KE - Consistent response format across all endpoints
 */

import { HTTP_STATUS } from './constants.js';

/**
 * Send a success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data (can be object, array, or null)
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} Express response
 */
export const successResponse = (res, data = null, message = 'Operation successful', statusCode = HTTP_STATUS.OK) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString()
  };

  // Only include data field if data is not null
  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {*} error - Optional error details (for development/logging)
 * @returns {Object} Express response
 */
export const errorResponse = (res, message = 'Internal server error', statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, error = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  // Include error details in development environment
  if (error && process.env.NODE_ENV === 'development') {
    response.error = error;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send a paginated success response
 * @param {Object} res - Express response object
 * @param {Array} data - Paginated data array
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @param {string} message - Success message
 * @returns {Object} Express response
 */
export const paginatedResponse = (res, data, page, limit, total, message = 'Operation successful') => {
  const totalPages = Math.ceil(total / limit);
  
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString(),
    data: {
      items: data,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: total,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }
  };

  return res.status(HTTP_STATUS.OK).json(response);
};

/**
 * Send a validation error response
 * @param {Object} res - Express response object
 * @param {Array} errors - Validation errors array
 * @returns {Object} Express response
 */
export const validationErrorResponse = (res, errors) => {
  const response = {
    success: false,
    message: 'Validation failed',
    timestamp: new Date().toISOString(),
    errors: errors
  };

  return res.status(HTTP_STATUS.BAD_REQUEST).json(response);
};

/**
 * Send a created resource response
 * @param {Object} res - Express response object
 * @param {*} data - Created resource data
 * @param {string} message - Success message
 * @returns {Object} Express response
 */
export const createdResponse = (res, data, message = 'Resource created successfully') => {
  return successResponse(res, data, message, HTTP_STATUS.CREATED);
};

/**
 * Send a no content response
 * @param {Object} res - Express response object
 * @returns {Object} Express response
 */
export const noContentResponse = (res) => {
  return res.status(HTTP_STATUS.NO_CONTENT).json();
};

// Export all response helpers as a single object for convenience
export default {
  successResponse,
  errorResponse,
  paginatedResponse,
  validationErrorResponse,
  createdResponse,
  noContentResponse
};