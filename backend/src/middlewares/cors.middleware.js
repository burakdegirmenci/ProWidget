/**
 * CORS Middleware
 * Cross-Origin Resource Sharing configuration
 *
 * @module middlewares/cors
 */

const cors = require('cors');
const config = require('../config');

/**
 * Parse CORS origins from config
 * Supports comma-separated origins in environment variable
 *
 * @returns {string|string[]|boolean} CORS origin configuration
 */
const parseOrigins = () => {
  const origin = config.cors.origin;

  // Allow all origins in development
  if (config.app.isDevelopment) {
    return true;
  }

  // Handle comma-separated origins
  if (origin.includes(',')) {
    return origin.split(',').map((o) => o.trim());
  }

  // Handle wildcard
  if (origin === '*') {
    return true;
  }

  return origin;
};

/**
 * CORS options for admin panel
 */
const adminCorsOptions = {
  origin: parseOrigins(),
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page',
    'X-Limit',
    'X-Total-Pages'
  ],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

/**
 * CORS options for public widget API
 * More permissive for cross-origin widget requests
 */
const publicCorsOptions = {
  origin: true, // Allow all origins for widget endpoints
  credentials: false,
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'X-API-Key',
    'Accept',
    'Origin'
  ],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

/**
 * Admin CORS middleware
 */
const adminCors = cors(adminCorsOptions);

/**
 * Public API CORS middleware
 */
const publicCors = cors(publicCorsOptions);

/**
 * Dynamic CORS middleware
 * Determines CORS options based on request path
 *
 * @param {Object} req - Express request object
 * @param {Function} callback - CORS callback
 */
const dynamicCors = (req, callback) => {
  let corsOptions;

  // Use public CORS for widget endpoints
  if (req.path.startsWith('/api/public') || req.path.match(/^\/api\/[^/]+\/(config|theme|data)/)) {
    corsOptions = publicCorsOptions;
  } else {
    corsOptions = adminCorsOptions;
  }

  callback(null, corsOptions);
};

/**
 * Combined CORS middleware using dynamic options
 */
const combinedCors = cors(dynamicCors);

module.exports = {
  adminCors,
  publicCors,
  combinedCors,
  adminCorsOptions,
  publicCorsOptions
};
