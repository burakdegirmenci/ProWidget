/**
 * Validation Middleware
 * Request validation using Zod schemas
 *
 * @module middlewares/validation
 */

const { ValidationError } = require('../exceptions');

/**
 * Validate request against Zod schema
 *
 * @param {Object} schema - Zod schema object with body, params, query
 * @returns {Function} Express middleware
 */
const validate = (schema) => {
  return async (req, res, next) => {
    try {
      // Build the object to validate - always include all parts
      const toValidate = {
        body: req.body,
        params: req.params,
        query: req.query
      };

      // Parse and validate
      const validated = await schema.parseAsync(toValidate);

      // Replace request data with validated and transformed data
      if (validated.body) {
        req.body = validated.body;
      }
      if (validated.params) {
        req.params = validated.params;
      }
      if (validated.query) {
        req.query = validated.query;
      }

      next();
    } catch (error) {
      // Handle Zod validation errors
      if (error.name === 'ZodError') {
        console.log('=== VALIDATION ERROR ===');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        console.log('Request params:', JSON.stringify(req.params, null, 2));
        console.log('Zod errors:', JSON.stringify(error.errors, null, 2));
        console.log('========================');
        return next(ValidationError.fromZodError(error));
      }
      next(error);
    }
  };
};

/**
 * Validate request body only
 *
 * @param {Object} schema - Zod schema for body
 * @returns {Function} Express middleware
 */
const validateBody = (schema) => {
  return async (req, res, next) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        return next(ValidationError.fromZodError(error));
      }
      next(error);
    }
  };
};

/**
 * Validate request params only
 *
 * @param {Object} schema - Zod schema for params
 * @returns {Function} Express middleware
 */
const validateParams = (schema) => {
  return async (req, res, next) => {
    try {
      req.params = await schema.parseAsync(req.params);
      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        return next(ValidationError.fromZodError(error));
      }
      next(error);
    }
  };
};

/**
 * Validate request query only
 *
 * @param {Object} schema - Zod schema for query
 * @returns {Function} Express middleware
 */
const validateQuery = (schema) => {
  return async (req, res, next) => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        return next(ValidationError.fromZodError(error));
      }
      next(error);
    }
  };
};

module.exports = {
  validate,
  validateBody,
  validateParams,
  validateQuery
};
