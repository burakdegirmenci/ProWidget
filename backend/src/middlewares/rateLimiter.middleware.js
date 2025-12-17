/**
 * Rate Limiter Middleware
 * Request rate limiting for API protection
 *
 * @module middlewares/rateLimiter
 */

const rateLimit = require('express-rate-limit');
const config = require('../config');
const { ApiResponse } = require('../utils');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

/**
 * Custom rate limit exceeded handler
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const rateLimitHandler = (req, res) => {
  return ApiResponse.error(
    res,
    'Too many requests, please try again later',
    HTTP_STATUS.TOO_MANY_REQUESTS,
    ERROR_CODES.RATE_LIMIT_EXCEEDED,
    {
      retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
    }
  );
};

/**
 * Skip rate limiting for certain requests
 *
 * @param {Object} req - Express request object
 * @returns {boolean} True to skip rate limiting
 */
const skipFunction = (req) => {
  // Skip for health check endpoint
  if (req.path === '/health' || req.path === '/api/health') {
    return true;
  }
  return false;
};

/**
 * Generate key for rate limiting
 *
 * @param {Object} req - Express request object
 * @returns {string} Rate limit key
 */
const keyGenerator = (req) => {
  // Use X-Forwarded-For header if behind proxy, otherwise use IP
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
  return ip;
};

/**
 * General API rate limiter
 * 100 requests per minute per IP
 */
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests',
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipFunction,
  keyGenerator
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per minute per IP
 */
const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMaxRequests,
  message: 'Too many authentication attempts',
  handler: (req, res) => {
    return ApiResponse.error(
      res,
      'Too many authentication attempts, please try again later',
      HTTP_STATUS.TOO_MANY_REQUESTS,
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      {
        retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
      }
    );
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator
});

/**
 * Public API rate limiter (for widget endpoints)
 * Higher limits for legitimate widget requests
 */
const publicApiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: 1000, // 1000 requests per minute
  message: 'Rate limit exceeded',
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by customer slug if available
    const slug = req.params.slug;
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    return slug ? `${slug}:${ip}` : ip;
  }
});

/**
 * Create custom rate limiter with specific settings
 *
 * @param {Object} options - Rate limiter options
 * @returns {Function} Rate limiter middleware
 */
const createLimiter = (options = {}) => {
  return rateLimit({
    windowMs: options.windowMs || config.rateLimit.windowMs,
    max: options.max || config.rateLimit.maxRequests,
    message: options.message || 'Too many requests',
    handler: options.handler || rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
    skip: options.skip || skipFunction,
    keyGenerator: options.keyGenerator || keyGenerator
  });
};

module.exports = {
  apiLimiter,
  authLimiter,
  publicApiLimiter,
  createLimiter
};
