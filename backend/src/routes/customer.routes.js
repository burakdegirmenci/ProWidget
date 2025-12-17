/**
 * Customer Routes
 * Customer management endpoints
 *
 * @module routes/customer
 */

const express = require('express');
const router = express.Router();
const { customerController } = require('../controllers');
const { authenticate, requireAdmin, requireEditor, validate } = require('../middlewares');
const { customer: validators } = require('../validators');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/admin/customers
 * @desc    Get all customers with pagination
 * @access  Private (all roles)
 */
router.get(
  '/',
  validate(validators.listCustomersSchema),
  customerController.getAll
);

/**
 * @route   POST /api/admin/customers
 * @desc    Create new customer
 * @access  Private (Admin, Editor)
 */
router.post(
  '/',
  requireEditor,
  validate(validators.createCustomerSchema),
  customerController.create
);

/**
 * @route   GET /api/admin/customers/check-slug/:slug
 * @desc    Check if slug is available
 * @access  Private (all roles)
 */
router.get(
  '/check-slug/:slug',
  validate(validators.customerSlugParam),
  customerController.checkSlug
);

/**
 * @route   GET /api/admin/customers/:id
 * @desc    Get customer by ID
 * @access  Private (all roles)
 */
router.get(
  '/:id',
  validate(validators.customerIdParam),
  customerController.getById
);

/**
 * @route   PATCH /api/admin/customers/:id
 * @desc    Update customer
 * @access  Private (Admin, Editor)
 */
router.patch(
  '/:id',
  requireEditor,
  validate(validators.updateCustomerSchema),
  customerController.update
);

/**
 * @route   DELETE /api/admin/customers/:id
 * @desc    Delete customer
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  requireAdmin,
  validate(validators.customerIdParam),
  customerController.remove
);

/**
 * @route   POST /api/admin/customers/:id/regenerate-key
 * @desc    Regenerate API key
 * @access  Private (Admin only)
 */
router.post(
  '/:id/regenerate-key',
  requireAdmin,
  validate(validators.customerIdParam),
  customerController.regenerateApiKey
);

/**
 * @route   GET /api/admin/customers/:id/stats
 * @desc    Get customer statistics
 * @access  Private (all roles)
 */
router.get(
  '/:id/stats',
  validate(validators.customerIdParam),
  customerController.getStats
);

module.exports = router;
