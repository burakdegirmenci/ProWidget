/**
 * Auth Routes
 * Authentication endpoints
 *
 * @module routes/auth
 */

const express = require('express');
const router = express.Router();
const { authController } = require('../controllers');
const { authenticate, validate, authLimiter } = require('../middlewares');
const { auth: validators } = require('../validators');

/**
 * @route   POST /api/admin/auth/register
 * @desc    Register new admin user
 * @access  Public (or Admin only in production)
 */
router.post(
  '/register',
  authLimiter,
  validate(validators.registerSchema),
  authController.register
);

/**
 * @route   POST /api/admin/auth/login
 * @desc    Login user and get tokens
 * @access  Public
 */
router.post(
  '/login',
  authLimiter,
  validate(validators.loginSchema),
  authController.login
);

/**
 * @route   POST /api/admin/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh',
  validate(validators.refreshTokenSchema),
  authController.refreshToken
);

/**
 * @route   POST /api/admin/auth/logout
 * @desc    Logout user (invalidate refresh token)
 * @access  Public
 */
router.post('/logout', authController.logout);

/**
 * @route   GET /api/admin/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, authController.getProfile);

/**
 * @route   POST /api/admin/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post(
  '/change-password',
  authenticate,
  validate(validators.changePasswordSchema),
  authController.changePassword
);

/**
 * @route   POST /api/admin/auth/logout-all
 * @desc    Logout from all devices
 * @access  Private
 */
router.post('/logout-all', authenticate, authController.logoutAll);

module.exports = router;
