/**
 * Response Utility
 * Standardized API response formatting
 *
 * @module utils/response
 */

const { HTTP_STATUS } = require('../config/constants');

/**
 * API Response Builder Class
 * Provides consistent response format across the API
 */
class ApiResponse {
  /**
   * Send success response
   *
   * @param {Object} res - Express response object
   * @param {Object} data - Response data
   * @param {string} message - Success message
   * @param {number} statusCode - HTTP status code
   * @returns {Object} Express response
   */
  static success(res, data = null, message = 'Success', statusCode = HTTP_STATUS.OK) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send created response (201)
   *
   * @param {Object} res - Express response object
   * @param {Object} data - Created resource data
   * @param {string} message - Success message
   * @returns {Object} Express response
   */
  static created(res, data = null, message = 'Resource created successfully') {
    return this.success(res, data, message, HTTP_STATUS.CREATED);
  }

  /**
   * Send no content response (204)
   *
   * @param {Object} res - Express response object
   * @returns {Object} Express response
   */
  static noContent(res) {
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  }

  /**
   * Send paginated response
   *
   * @param {Object} res - Express response object
   * @param {Array} data - Array of items
   * @param {Object} pagination - Pagination metadata
   * @param {string} message - Success message
   * @returns {Object} Express response
   */
  static paginated(res, data, pagination, message = 'Success') {
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message,
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: Math.ceil(pagination.total / pagination.limit),
        hasNextPage: pagination.page < Math.ceil(pagination.total / pagination.limit),
        hasPrevPage: pagination.page > 1
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send error response
   *
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} errorCode - Application error code
   * @param {Object} details - Additional error details
   * @returns {Object} Express response
   */
  static error(
    res,
    message = 'An error occurred',
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    errorCode = 'INTERNAL_ERROR',
    details = null
  ) {
    const response = {
      success: false,
      error: {
        code: errorCode,
        message
      },
      timestamp: new Date().toISOString()
    };

    if (details) {
      response.error.details = details;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send validation error response
   *
   * @param {Object} res - Express response object
   * @param {Array} errors - Validation errors
   * @returns {Object} Express response
   */
  static validationError(res, errors) {
    return this.error(
      res,
      'Validation failed',
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      'VALIDATION_ERROR',
      { errors }
    );
  }

  /**
   * Send unauthorized response
   *
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @returns {Object} Express response
   */
  static unauthorized(res, message = 'Unauthorized') {
    return this.error(res, message, HTTP_STATUS.UNAUTHORIZED, 'AUTH_UNAUTHORIZED');
  }

  /**
   * Send forbidden response
   *
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @returns {Object} Express response
   */
  static forbidden(res, message = 'Forbidden') {
    return this.error(res, message, HTTP_STATUS.FORBIDDEN, 'AUTH_FORBIDDEN');
  }

  /**
   * Send not found response
   *
   * @param {Object} res - Express response object
   * @param {string} resource - Resource name
   * @returns {Object} Express response
   */
  static notFound(res, resource = 'Resource') {
    return this.error(
      res,
      `${resource} not found`,
      HTTP_STATUS.NOT_FOUND,
      'RESOURCE_NOT_FOUND'
    );
  }

  /**
   * Send conflict response
   *
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @returns {Object} Express response
   */
  static conflict(res, message = 'Resource already exists') {
    return this.error(
      res,
      message,
      HTTP_STATUS.CONFLICT,
      'RESOURCE_ALREADY_EXISTS'
    );
  }

  /**
   * Send rate limit exceeded response
   *
   * @param {Object} res - Express response object
   * @returns {Object} Express response
   */
  static rateLimitExceeded(res) {
    return this.error(
      res,
      'Too many requests, please try again later',
      HTTP_STATUS.TOO_MANY_REQUESTS,
      'RATE_LIMIT_EXCEEDED'
    );
  }
}

module.exports = ApiResponse;
