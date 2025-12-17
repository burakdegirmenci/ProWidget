/**
 * Authentication Error Class
 * Used for authentication and authorization failures
 *
 * @class AuthenticationError
 * @extends AppError
 */

const AppError = require('./AppError');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

class AuthenticationError extends AppError {
  /**
   * Creates an AuthenticationError instance
   *
   * @param {string} message - Error message
   * @param {string} errorCode - Specific auth error code
   */
  constructor(message = 'Authentication failed', errorCode = ERROR_CODES.AUTH_UNAUTHORIZED) {
    super(message, HTTP_STATUS.UNAUTHORIZED, errorCode);
  }

  /**
   * Create invalid credentials error
   * @returns {AuthenticationError}
   */
  static invalidCredentials() {
    return new AuthenticationError(
      'Invalid email or password',
      ERROR_CODES.AUTH_INVALID_CREDENTIALS
    );
  }

  /**
   * Create token expired error
   * @returns {AuthenticationError}
   */
  static tokenExpired() {
    return new AuthenticationError(
      'Token has expired',
      ERROR_CODES.AUTH_TOKEN_EXPIRED
    );
  }

  /**
   * Create invalid token error
   * @returns {AuthenticationError}
   */
  static invalidToken() {
    return new AuthenticationError(
      'Invalid or malformed token',
      ERROR_CODES.AUTH_TOKEN_INVALID
    );
  }

  /**
   * Create no token provided error
   * @returns {AuthenticationError}
   */
  static noToken() {
    return new AuthenticationError(
      'No authentication token provided',
      ERROR_CODES.AUTH_UNAUTHORIZED
    );
  }

  /**
   * Create forbidden error (authorized but not permitted)
   * @param {string} message - Custom message
   * @returns {AppError}
   */
  static forbidden(message = 'You do not have permission to perform this action') {
    return new AppError(
      message,
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.AUTH_FORBIDDEN
    );
  }
}

module.exports = AuthenticationError;
