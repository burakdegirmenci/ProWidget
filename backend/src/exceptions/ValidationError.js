/**
 * Validation Error Class
 * Used for input validation failures
 *
 * @class ValidationError
 * @extends AppError
 */

const AppError = require('./AppError');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

class ValidationError extends AppError {
  /**
   * Creates a ValidationError instance
   *
   * @param {string} message - Error message
   * @param {Array|Object} errors - Validation errors
   */
  constructor(message = 'Validation failed', errors = []) {
    super(
      message,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      ERROR_CODES.VALIDATION_ERROR,
      { errors }
    );

    this.errors = errors;
  }

  /**
   * Create from Zod validation error
   * @param {Object} zodError - Zod validation error
   * @returns {ValidationError}
   */
  static fromZodError(zodError) {
    const errors = zodError.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    }));

    return new ValidationError('Validation failed', errors);
  }

  /**
   * Create from field errors object
   * @param {Object} fieldErrors - Object with field names as keys
   * @returns {ValidationError}
   */
  static fromFieldErrors(fieldErrors) {
    const errors = Object.entries(fieldErrors).map(([field, message]) => ({
      field,
      message
    }));

    return new ValidationError('Validation failed', errors);
  }
}

module.exports = ValidationError;
