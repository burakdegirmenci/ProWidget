/**
 * Logger Utility for XML Parser
 * Provides structured logging for the parser service
 *
 * @module utils/logger
 */

const winston = require('winston');
const path = require('path');
const config = require('../config');

/**
 * Custom log format
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [XML-PARSER] [${level.toUpperCase()}]: ${message}${metaStr}`;
  })
);

/**
 * Console format with colors
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

/**
 * Create logger instance
 */
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'xml-parser' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat
    })
  ]
});

// Add file transport if log file is specified
if (config.logging.file) {
  const logDir = path.dirname(config.logging.file);

  logger.add(
    new winston.transports.File({
      filename: config.logging.file,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: logFormat
    })
  );

  logger.add(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
      format: logFormat
    })
  );
}

/**
 * Log sync start
 * @param {string} customerId - Customer ID
 * @param {string} customerName - Customer name
 */
logger.syncStart = (customerId, customerName) => {
  logger.info(`Starting sync for customer: ${customerName}`, { customerId });
};

/**
 * Log sync success
 * @param {string} customerId - Customer ID
 * @param {number} productCount - Number of products synced
 * @param {number} duration - Duration in ms
 */
logger.syncSuccess = (customerId, productCount, duration) => {
  logger.info(`Sync completed successfully`, {
    customerId,
    productCount,
    duration: `${duration}ms`
  });
};

/**
 * Log sync failure
 * @param {string} customerId - Customer ID
 * @param {Error} error - Error object
 */
logger.syncError = (customerId, error) => {
  logger.error(`Sync failed for customer`, {
    customerId,
    error: error.message,
    stack: error.stack
  });
};

/**
 * Log parse error
 * @param {string} customerId - Customer ID
 * @param {string} feedUrl - Feed URL
 * @param {Error} error - Error object
 */
logger.parseError = (customerId, feedUrl, error) => {
  logger.error(`Failed to parse XML feed`, {
    customerId,
    feedUrl,
    error: error.message
  });
};

/**
 * Log fetch error
 * @param {string} url - Feed URL
 * @param {Error} error - Error object
 */
logger.fetchError = (url, error) => {
  logger.error(`Failed to fetch feed`, {
    url,
    error: error.message,
    code: error.code
  });
};

module.exports = logger;
