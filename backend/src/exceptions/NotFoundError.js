/**
 * Not Found Error Class
 * Used when a requested resource doesn't exist
 *
 * @class NotFoundError
 * @extends AppError
 */

const AppError = require('./AppError');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

class NotFoundError extends AppError {
  /**
   * Creates a NotFoundError instance
   *
   * @param {string} resource - Name of the resource
   * @param {string} identifier - Resource identifier (optional)
   */
  constructor(resource = 'Resource', identifier = null) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;

    super(message, HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, {
      resource,
      identifier
    });

    this.resource = resource;
    this.identifier = identifier;
  }

  /**
   * Create customer not found error
   * @param {string} identifier - Customer ID or slug
   * @returns {NotFoundError}
   */
  static customer(identifier) {
    return new NotFoundError('Customer', identifier);
  }

  /**
   * Create widget not found error
   * @param {string} identifier - Widget ID
   * @returns {NotFoundError}
   */
  static widget(identifier) {
    return new NotFoundError('Widget', identifier);
  }

  /**
   * Create theme not found error
   * @param {string} identifier - Theme ID
   * @returns {NotFoundError}
   */
  static theme(identifier) {
    return new NotFoundError('Theme', identifier);
  }

  /**
   * Create feed not found error
   * @param {string} identifier - Feed ID
   * @returns {NotFoundError}
   */
  static feed(identifier) {
    return new NotFoundError('Feed', identifier);
  }

  /**
   * Create product not found error
   * @param {string} identifier - Product ID
   * @returns {NotFoundError}
   */
  static product(identifier) {
    return new NotFoundError('Product', identifier);
  }

  /**
   * Create user not found error
   * @param {string} identifier - User ID or email
   * @returns {NotFoundError}
   */
  static user(identifier) {
    return new NotFoundError('User', identifier);
  }

  /**
   * Create route not found error
   * @param {string} path - Request path
   * @returns {NotFoundError}
   */
  static route(path) {
    return new NotFoundError('Route', path);
  }
}

module.exports = NotFoundError;
