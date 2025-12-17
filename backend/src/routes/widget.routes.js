/**
 * Widget Routes
 * Widget configuration endpoints
 *
 * @module routes/widget
 */

const express = require('express');
const router = express.Router();
const { widgetController } = require('../controllers');
const { authenticate, requireEditor, validate } = require('../middlewares');
const { widget: validators, customer: customerValidators } = require('../validators');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/admin/customers/:id/widgets
 * @desc    Get all widgets for a customer
 * @access  Private (all roles)
 */
router.get(
  '/customers/:id/widgets',
  validate(validators.listWidgetsSchema),
  widgetController.getByCustomer
);

/**
 * @route   POST /api/admin/customers/:id/widgets
 * @desc    Create new widget for customer
 * @access  Private (Admin, Editor)
 */
router.post(
  '/customers/:id/widgets',
  requireEditor,
  validate(validators.createWidgetSchema),
  widgetController.create
);

/**
 * @route   GET /api/admin/customers/:id/widgets/count
 * @desc    Get widget count by type
 * @access  Private (all roles)
 */
router.get(
  '/customers/:id/widgets/count',
  validate(customerValidators.customerIdParam),
  widgetController.getCountByType
);

/**
 * @route   POST /api/admin/customers/:id/widgets/reorder
 * @desc    Reorder widgets
 * @access  Private (Admin, Editor)
 */
router.post(
  '/customers/:id/widgets/reorder',
  requireEditor,
  validate(customerValidators.customerIdParam),
  widgetController.reorder
);

/**
 * @route   GET /api/admin/widgets/:id
 * @desc    Get widget by ID
 * @access  Private (all roles)
 */
router.get(
  '/widgets/:id',
  validate(validators.widgetIdParam),
  widgetController.getById
);

/**
 * @route   PATCH /api/admin/widgets/:id
 * @desc    Update widget
 * @access  Private (Admin, Editor)
 */
router.patch(
  '/widgets/:id',
  requireEditor,
  validate(validators.updateWidgetSchema),
  widgetController.update
);

/**
 * @route   DELETE /api/admin/widgets/:id
 * @desc    Delete widget
 * @access  Private (Admin, Editor)
 */
router.delete(
  '/widgets/:id',
  requireEditor,
  validate(validators.widgetIdParam),
  widgetController.remove
);

/**
 * @route   POST /api/admin/widgets/:id/duplicate
 * @desc    Duplicate widget
 * @access  Private (Admin, Editor)
 */
router.post(
  '/widgets/:id/duplicate',
  requireEditor,
  validate(validators.widgetIdParam),
  widgetController.duplicate
);

/**
 * @route   PATCH /api/admin/widgets/:id/toggle
 * @desc    Toggle widget active status
 * @access  Private (Admin, Editor)
 */
router.patch(
  '/widgets/:id/toggle',
  requireEditor,
  validate(validators.widgetIdParam),
  widgetController.toggleActive
);

/**
 * @route   PATCH /api/admin/widgets/:id/priority
 * @desc    Update widget priority
 * @access  Private (Admin, Editor)
 */
router.patch(
  '/widgets/:id/priority',
  requireEditor,
  validate(validators.widgetIdParam),
  widgetController.updatePriority
);

module.exports = router;
