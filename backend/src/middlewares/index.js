/**
 * Middlewares Index
 * Central export for all middleware modules
 *
 * @module middlewares
 */

const authMiddleware = require('./auth.middleware');
const validationMiddleware = require('./validation.middleware');
const errorMiddleware = require('./error.middleware');
const rateLimiterMiddleware = require('./rateLimiter.middleware');
const corsMiddleware = require('./cors.middleware');
const loggerMiddleware = require('./logger.middleware');

module.exports = {
  // Auth
  authenticate: authMiddleware.authenticate,
  authorize: authMiddleware.authorize,
  requireAdmin: authMiddleware.requireAdmin,
  requireEditor: authMiddleware.requireEditor,
  optionalAuth: authMiddleware.optionalAuth,
  validateApiKey: authMiddleware.validateApiKey,

  // Validation
  validate: validationMiddleware.validate,
  validateBody: validationMiddleware.validateBody,
  validateParams: validationMiddleware.validateParams,
  validateQuery: validationMiddleware.validateQuery,

  // Error handling
  notFoundHandler: errorMiddleware.notFoundHandler,
  errorHandler: errorMiddleware.errorHandler,
  asyncHandler: errorMiddleware.asyncHandler,

  // Rate limiting
  apiLimiter: rateLimiterMiddleware.apiLimiter,
  authLimiter: rateLimiterMiddleware.authLimiter,
  publicApiLimiter: rateLimiterMiddleware.publicApiLimiter,
  createLimiter: rateLimiterMiddleware.createLimiter,

  // CORS
  adminCors: corsMiddleware.adminCors,
  publicCors: corsMiddleware.publicCors,
  combinedCors: corsMiddleware.combinedCors,

  // Logging
  httpLogger: loggerMiddleware.httpLogger,
  requestTiming: loggerMiddleware.requestTiming,
  requestId: loggerMiddleware.requestId
};
