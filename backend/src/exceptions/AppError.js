/**
 * Base Application Error Class
 * All custom errors should extend this class
 *
 * @class AppError
 * @extends Error
 */

const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

class AppError extends Error {
  /**
   * Creates an AppError instance
   *
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} errorCode - Application error code
   * @param {Object} details - Additional error details
   */
  constructor(
    message,
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    errorCode = ERROR_CODES.INTERNAL_ERROR,
    details = null
  ) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;
    this.timestamp = new Date().toISOString();

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON format
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      success: false,
      error: {
        code: this.errorCode,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp
      }
    };
  }

  /**
   * Create a Bad Request error
   * @param {string} message - Error message
   * @param {Object} details - Error details
   * @returns {AppError}
   */
  static badRequest(message = 'Bad Request', details = null) {
    return new AppError(
      message,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.INVALID_INPUT,
      details
    );
  }

  /**
   * Create an Unauthorized error
   * @param {string} message - Error message
   * @returns {AppError}
   */
  static unauthorized(message = 'Unauthorized') {
    return new AppError(
      message,
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.AUTH_UNAUTHORIZED
    );
  }

  /**
   * Create a Forbidden error
   * @param {string} message - Error message
   * @returns {AppError}
   */
  static forbidden(message = 'Forbidden') {
    return new AppError(
      message,
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.AUTH_FORBIDDEN
    );
  }

  /**
   * Create a Not Found error
   * @param {string} resource - Resource name
   * @returns {AppError}
   */
  static notFound(resource = 'Resource') {
    return new AppError(
      `${resource} not found`,
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.RESOURCE_NOT_FOUND
    );
  }

  /**
   * Create a Conflict error
   * @param {string} message - Error message
   * @returns {AppError}
   */
  static conflict(message = 'Resource already exists') {
    return new AppError(
      message,
      HTTP_STATUS.CONFLICT,
      ERROR_CODES.RESOURCE_ALREADY_EXISTS
    );
  }

  /**
   * Create an Internal Server Error
   * @param {string} message - Error message
   * @returns {AppError}
   */
  static internal(message = 'Internal Server Error') {
    return new AppError(
      message,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_ERROR
    );
  }
}

module.exports = AppError;
