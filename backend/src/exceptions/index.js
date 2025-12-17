/**
 * Exceptions Index
 * Central export for all custom error classes
 *
 * @module exceptions
 */

const AppError = require('./AppError');
const ValidationError = require('./ValidationError');
const AuthenticationError = require('./AuthenticationError');
const NotFoundError = require('./NotFoundError');

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  NotFoundError
};
