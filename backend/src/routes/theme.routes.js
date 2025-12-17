/**
 * Theme Routes
 * Theme management endpoints
 *
 * @module routes/theme
 */

const express = require('express');
const router = express.Router();
const { themeController } = require('../controllers');
const { authenticate, requireEditor, validate } = require('../middlewares');
const { theme: validators, customer: customerValidators } = require('../validators');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/admin/customers/:id/themes
 * @desc    Get all themes for a customer
 * @access  Private (all roles)
 */
router.get(
  '/customers/:id/themes',
  validate(validators.listThemesSchema),
  themeController.getByCustomer
);

/**
 * @route   GET /api/admin/customers/:id/theme
 * @desc    Get active theme for a customer
 * @access  Private (all roles)
 */
router.get(
  '/customers/:id/theme',
  validate(customerValidators.customerIdParam),
  themeController.getActiveTheme
);

/**
 * @route   POST /api/admin/customers/:id/theme
 * @desc    Create new theme for customer
 * @access  Private (Admin, Editor)
 */
router.post(
  '/customers/:id/theme',
  requireEditor,
  validate(validators.createThemeSchema),
  themeController.create
);

/**
 * @route   GET /api/admin/themes/:id
 * @desc    Get theme by ID
 * @access  Private (all roles)
 */
router.get(
  '/themes/:id',
  validate(validators.themeIdParam),
  themeController.getById
);

/**
 * @route   PATCH /api/admin/themes/:id
 * @desc    Update theme
 * @access  Private (Admin, Editor)
 */
router.patch(
  '/themes/:id',
  requireEditor,
  validate(validators.updateThemeSchema),
  themeController.update
);

/**
 * @route   DELETE /api/admin/themes/:id
 * @desc    Delete theme
 * @access  Private (Admin, Editor)
 */
router.delete(
  '/themes/:id',
  requireEditor,
  validate(validators.themeIdParam),
  themeController.remove
);

/**
 * @route   POST /api/admin/themes/:id/activate
 * @desc    Activate theme
 * @access  Private (Admin, Editor)
 */
router.post(
  '/themes/:id/activate',
  requireEditor,
  validate(validators.themeIdParam),
  themeController.activate
);

/**
 * @route   POST /api/admin/themes/:id/duplicate
 * @desc    Duplicate theme
 * @access  Private (Admin, Editor)
 */
router.post(
  '/themes/:id/duplicate',
  requireEditor,
  validate(validators.themeIdParam),
  themeController.duplicate
);

/**
 * @route   GET /api/admin/themes/:id/css
 * @desc    Get generated CSS for theme
 * @access  Private (all roles)
 */
router.get(
  '/themes/:id/css',
  validate(validators.themeIdParam),
  themeController.generateCss
);

module.exports = router;
