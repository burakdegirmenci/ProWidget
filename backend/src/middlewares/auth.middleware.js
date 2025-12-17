/**
 * Authentication Middleware
 * JWT token verification and user authentication
 *
 * @module middlewares/auth
 */

const { prisma } = require('../models');
const { crypto } = require('../utils');
const { AuthenticationError } = require('../exceptions');
const { USER_ROLES } = require('../config/constants');

/**
 * Verify JWT token and attach user to request
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract token from header
    const authHeader = req.headers.authorization;
    const token = crypto.token.extractFromHeader(authHeader);

    if (!token) {
      throw AuthenticationError.noToken();
    }

    // Verify token
    let decoded;
    try {
      decoded = crypto.token.verify(token, { audience: 'prowidget-api' });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw AuthenticationError.tokenExpired();
      }
      throw AuthenticationError.invalidToken();
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true
      }
    });

    if (!user) {
      throw AuthenticationError.invalidToken();
    }

    if (!user.isActive) {
      throw AuthenticationError.forbidden('Your account has been deactivated');
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user has required role
 *
 * @param {...string} allowedRoles - Allowed roles
 * @returns {Function} Express middleware
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(AuthenticationError.noToken());
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        AuthenticationError.forbidden(
          'You do not have permission to access this resource'
        )
      );
    }

    next();
  };
};

/**
 * Require admin role
 */
const requireAdmin = authorize(USER_ROLES.ADMIN);

/**
 * Require admin or editor role
 */
const requireEditor = authorize(USER_ROLES.ADMIN, USER_ROLES.EDITOR);

/**
 * Optional authentication - attach user if token is valid, but don't fail
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = crypto.token.extractFromHeader(authHeader);

    if (!token) {
      return next();
    }

    try {
      const decoded = crypto.token.verify(token, { audience: 'prowidget-api' });
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          isActive: true
        }
      });

      if (user && user.isActive) {
        req.user = user;
      }
    } catch (error) {
      // Token invalid, but optional - continue without user
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate API key for public endpoints
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      // API key is optional for public endpoints
      return next();
    }

    const customer = await prisma.customer.findUnique({
      where: { apiKey },
      select: {
        id: true,
        slug: true,
        isActive: true
      }
    });

    if (customer && customer.isActive) {
      req.apiCustomer = customer;
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate,
  authorize,
  requireAdmin,
  requireEditor,
  optionalAuth,
  validateApiKey
};
