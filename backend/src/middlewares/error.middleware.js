/**
 * Error Handler Middleware
 * Global error handling and response formatting
 *
 * @module middlewares/error
 */

const { AppError } = require('../exceptions');
const { ApiResponse, logger } = require('../utils');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');
const config = require('../config');

/**
 * Handle 404 Not Found errors
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Route ${req.method} ${req.originalUrl} not found`,
    HTTP_STATUS.NOT_FOUND,
    ERROR_CODES.RESOURCE_NOT_FOUND
  );
  next(error);
};

/**
 * Global error handler
 *
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Log error
  logger.logError(err, req);

  // Handle operational errors (known errors)
  if (err.isOperational) {
    return ApiResponse.error(
      res,
      err.message,
      err.statusCode,
      err.errorCode,
      err.details
    );
  }

  // Handle Prisma errors
  if (err.code && err.code.startsWith('P')) {
    return handlePrismaError(err, res);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.error(
      res,
      'Invalid token',
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.AUTH_TOKEN_INVALID
    );
  }

  if (err.name === 'TokenExpiredError') {
    return ApiResponse.error(
      res,
      'Token has expired',
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.AUTH_TOKEN_EXPIRED
    );
  }

  // Handle syntax errors (malformed JSON)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return ApiResponse.error(
      res,
      'Invalid JSON payload',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.INVALID_INPUT
    );
  }

  // Handle unknown errors
  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = config.app.isProduction
    ? 'An unexpected error occurred'
    : err.message;

  // Include stack trace in development
  const details = config.app.isDevelopment
    ? { stack: err.stack }
    : null;

  return ApiResponse.error(
    res,
    message,
    statusCode,
    ERROR_CODES.INTERNAL_ERROR,
    details
  );
};

/**
 * Handle Prisma ORM errors
 *
 * @param {Error} err - Prisma error
 * @param {Object} res - Express response object
 */
const handlePrismaError = (err, res) => {
  switch (err.code) {
    // Unique constraint violation
    case 'P2002': {
      const field = err.meta?.target?.[0] || 'field';
      return ApiResponse.error(
        res,
        `A record with this ${field} already exists`,
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.RESOURCE_ALREADY_EXISTS,
        { field }
      );
    }

    // Foreign key constraint violation
    case 'P2003': {
      return ApiResponse.error(
        res,
        'Related record not found',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_INPUT
      );
    }

    // Record not found
    case 'P2025': {
      return ApiResponse.error(
        res,
        'Record not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    // Invalid data
    case 'P2000': {
      return ApiResponse.error(
        res,
        'Invalid data provided',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_INPUT
      );
    }

    // Connection error
    case 'P1001':
    case 'P1002': {
      logger.error('Database connection error', { code: err.code, message: err.message });
      return ApiResponse.error(
        res,
        'Database connection error',
        HTTP_STATUS.SERVICE_UNAVAILABLE,
        ERROR_CODES.DATABASE_ERROR
      );
    }

    // Default Prisma error
    default: {
      logger.error('Unhandled Prisma error', { code: err.code, message: err.message });
      return ApiResponse.error(
        res,
        'Database operation failed',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODES.DATABASE_ERROR
      );
    }
  }
};

/**
 * Async handler wrapper to catch errors in async route handlers
 *
 * @param {Function} fn - Async route handler
 * @returns {Function} Wrapped handler
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  notFoundHandler,
  errorHandler,
  asyncHandler
};
