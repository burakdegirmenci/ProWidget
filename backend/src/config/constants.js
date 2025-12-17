/**
 * Application Constants
 * Centralized constant definitions for the application
 *
 * @module config/constants
 */

/**
 * User roles for authorization
 * @enum {string}
 */
const USER_ROLES = Object.freeze({
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer'
});

/**
 * Widget types supported by the platform
 * @enum {string}
 */
const WIDGET_TYPES = Object.freeze({
  CAROUSEL: 'carousel',
  BANNER: 'banner',
  POPUP: 'popup',
  GRID: 'grid',
  SLIDER: 'slider',
  CUSTOM: 'custom'
});

/**
 * XML feed formats supported
 * @enum {string}
 */
const FEED_FORMATS = Object.freeze({
  GOOGLE: 'google',
  FACEBOOK: 'facebook',
  CUSTOM: 'custom'
});

/**
 * Feed sync status
 * @enum {string}
 */
const FEED_STATUS = Object.freeze({
  ACTIVE: 'active',
  ERROR: 'error',
  PENDING: 'pending',
  SYNCING: 'syncing'
});

/**
 * Product stock status
 * @enum {string}
 */
const STOCK_STATUS = Object.freeze({
  IN_STOCK: 'in_stock',
  OUT_OF_STOCK: 'out_of_stock',
  PREORDER: 'preorder'
});

/**
 * HTTP status codes
 * @enum {number}
 */
const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
});

/**
 * Error codes for client identification
 * @enum {string}
 */
const ERROR_CODES = Object.freeze({
  // Authentication errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Resource errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR'
});

/**
 * Cache TTL values in seconds
 * @enum {number}
 */
const CACHE_TTL = Object.freeze({
  SHORT: 60,           // 1 minute
  MEDIUM: 300,         // 5 minutes
  LONG: 600,           // 10 minutes
  VERY_LONG: 3600,     // 1 hour
  DAY: 86400           // 24 hours
});

/**
 * Pagination defaults
 * @enum {number}
 */
const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
});

/**
 * API key length
 * @type {number}
 */
const API_KEY_LENGTH = 32;

/**
 * Slug regex pattern
 * @type {RegExp}
 */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Hex color regex pattern
 * @type {RegExp}
 */
const HEX_COLOR_PATTERN = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

module.exports = {
  USER_ROLES,
  WIDGET_TYPES,
  FEED_FORMATS,
  FEED_STATUS,
  STOCK_STATUS,
  HTTP_STATUS,
  ERROR_CODES,
  CACHE_TTL,
  PAGINATION,
  API_KEY_LENGTH,
  SLUG_PATTERN,
  HEX_COLOR_PATTERN
};
