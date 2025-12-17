/**
 * Logger Middleware
 * HTTP request logging using Morgan and Winston
 *
 * @module middlewares/logger
 */

const morgan = require('morgan');
const { logger } = require('../utils');
const config = require('../config');

/**
 * Custom Morgan tokens
 */
morgan.token('user-id', (req) => {
  return req.user?.id || 'anonymous';
});

morgan.token('customer-slug', (req) => {
  return req.params?.slug || '-';
});

morgan.token('body', (req) => {
  // Don't log sensitive fields
  if (req.body) {
    const sanitized = { ...req.body };
    const sensitiveFields = ['password', 'passwordHash', 'token', 'refreshToken', 'apiKey'];
    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    return JSON.stringify(sanitized);
  }
  return '-';
});

morgan.token('error-message', (req, res) => {
  return res.locals.errorMessage || '-';
});

/**
 * Development log format
 * Colorized and verbose
 */
const devFormat = ':method :url :status :response-time ms - :res[content-length]';

/**
 * Production log format
 * JSON structured logging
 */
const prodFormat = JSON.stringify({
  method: ':method',
  url: ':url',
  status: ':status',
  responseTime: ':response-time ms',
  contentLength: ':res[content-length]',
  userId: ':user-id',
  ip: ':remote-addr',
  userAgent: ':user-agent'
});

/**
 * Combined format with additional details
 */
const combinedFormat = ':remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms';

/**
 * Skip logging for certain requests
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {boolean} True to skip logging
 */
const skipFunction = (req, res) => {
  // Skip health check endpoints
  if (req.path === '/health' || req.path === '/api/health') {
    return true;
  }

  // Skip static files in production
  if (config.app.isProduction && req.path.match(/\.(js|css|png|jpg|ico)$/)) {
    return true;
  }

  return false;
};

/**
 * Development HTTP logger
 */
const devLogger = morgan(devFormat, {
  skip: skipFunction,
  stream: logger.stream
});

/**
 * Production HTTP logger
 */
const prodLogger = morgan(config.logging.format === 'combined' ? combinedFormat : prodFormat, {
  skip: skipFunction,
  stream: logger.stream
});

/**
 * Get appropriate logger based on environment
 */
const httpLogger = config.app.isProduction ? prodLogger : devLogger;

/**
 * Request timing middleware
 * Adds timing information to requests
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requestTiming = (req, res, next) => {
  req.startTime = Date.now();

  // Add response timing header
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`,
        status: res.statusCode
      });
    }
  });

  next();
};

/**
 * Request ID middleware
 * Adds unique ID to each request for tracing
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requestId = (req, res, next) => {
  const id = req.headers['x-request-id'] || require('crypto').randomUUID();
  req.id = id;
  res.setHeader('X-Request-ID', id);
  next();
};

module.exports = {
  httpLogger,
  devLogger,
  prodLogger,
  requestTiming,
  requestId
};
