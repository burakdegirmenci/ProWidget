/**
 * Feed Routes
 * XML feed management endpoints
 *
 * @module routes/feed
 */

const express = require('express');
const router = express.Router();
const { feedController } = require('../controllers');
const { authenticate, requireEditor, validate } = require('../middlewares');
const { feed: validators, customer: customerValidators } = require('../validators');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/admin/customers/:id/feeds
 * @desc    Get all feeds for a customer
 * @access  Private (all roles)
 */
router.get(
  '/customers/:id/feeds',
  validate(validators.listFeedsSchema),
  feedController.getByCustomer
);

/**
 * @route   POST /api/admin/customers/:id/feeds
 * @desc    Create new feed for customer
 * @access  Private (Admin, Editor)
 */
router.post(
  '/customers/:id/feeds',
  requireEditor,
  validate(validators.createFeedSchema),
  feedController.create
);

/**
 * @route   GET /api/admin/customers/:id/feeds/stats
 * @desc    Get feed statistics for customer
 * @access  Private (all roles)
 */
router.get(
  '/customers/:id/feeds/stats',
  validate(customerValidators.customerIdParam),
  feedController.getStats
);

/**
 * @route   GET /api/admin/feeds/:id
 * @desc    Get feed by ID
 * @access  Private (all roles)
 */
router.get(
  '/feeds/:id',
  validate(validators.feedIdParam),
  feedController.getById
);

/**
 * @route   PATCH /api/admin/feeds/:id
 * @desc    Update feed
 * @access  Private (Admin, Editor)
 */
router.patch(
  '/feeds/:id',
  requireEditor,
  validate(validators.updateFeedSchema),
  feedController.update
);

/**
 * @route   DELETE /api/admin/feeds/:id
 * @desc    Delete feed
 * @access  Private (Admin, Editor)
 */
router.delete(
  '/feeds/:id',
  requireEditor,
  validate(validators.feedIdParam),
  feedController.remove
);

/**
 * @route   POST /api/admin/feeds/:id/sync
 * @desc    Trigger manual sync
 * @access  Private (Admin, Editor)
 */
router.post(
  '/feeds/:id/sync',
  requireEditor,
  validate(validators.feedIdParam),
  feedController.triggerSync
);

/**
 * @route   GET /api/admin/feeds/:id/products
 * @desc    Get products from feed
 * @access  Private (all roles)
 */
router.get(
  '/feeds/:id/products',
  validate(validators.feedIdParam),
  feedController.getProducts
);

module.exports = router;
