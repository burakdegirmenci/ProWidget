/**
 * Logger Utility
 * Centralized logging using Winston
 *
 * @module utils/logger
 */

const winston = require('winston');
const config = require('../config');

/**
 * Custom log format for development
 */
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

/**
 * Custom log format for production (JSON)
 */
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Create Winston logger instance
 */
const logger = winston.createLogger({
  level: config.logging.level,
  format: config.app.isProduction ? prodFormat : devFormat,
  defaultMeta: {
    service: 'prowidget-backend'
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true
    })
  ],
  exitOnError: false
});

// Add file transports in production
if (config.app.isProduction) {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );

  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
}

/**
 * Stream for Morgan HTTP logger
 */
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

/**
 * Log request details
 * @param {Object} req - Express request object
 * @param {string} message - Log message
 */
logger.logRequest = (req, message = 'Request received') => {
  logger.info(message, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
};

/**
 * Log error with request context
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 */
logger.logError = (error, req = null) => {
  const errorInfo = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    code: error.errorCode || error.code
  };

  if (req) {
    errorInfo.request = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userId: req.user?.id
    };
  }

  logger.error('Error occurred', errorInfo);
};

module.exports = logger;
