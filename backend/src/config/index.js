/**
 * Configuration Aggregator
 * Centralizes all configuration loading and validation
 *
 * @module config
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Validates required environment variables
 * @param {string[]} requiredVars - Array of required variable names
 * @throws {Error} If any required variable is missing
 */
const validateEnv = (requiredVars) => {
  const missing = requiredVars.filter((varName) => !process.env[varName]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

// Validate critical environment variables in production
if (process.env.NODE_ENV === 'production') {
  validateEnv([
    'DATABASE_URL',
    'JWT_SECRET',
    'CORS_ORIGIN'
  ]);
}

/**
 * Application configuration object
 * @type {Object}
 */
const config = {
  // Application settings
  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3000,
    apiVersion: process.env.API_VERSION || 'v1',
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    isTest: process.env.NODE_ENV === 'test'
  },

  // Database configuration
  database: {
    url: process.env.DATABASE_URL
  },

  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d'
  },

  // Bcrypt configuration
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12
  },

  // Rate limiting configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    authMaxRequests: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS, 10) || 5
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: process.env.CORS_CREDENTIALS === 'true'
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    format: process.env.LOG_FORMAT || 'combined'
  },

  // External URLs
  urls: {
    cdn: process.env.CDN_BASE_URL || 'https://cdn.prowidget.com',
    api: process.env.API_BASE_URL || 'http://localhost:3000',
    adminPanel: process.env.ADMIN_PANEL_URL || 'http://localhost:3001'
  }
};

// Freeze configuration to prevent modifications
Object.freeze(config);

module.exports = config;
