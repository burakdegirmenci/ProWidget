/**
 * Product Routes
 * Product data endpoints
 *
 * @module routes/product
 */

const express = require('express');
const router = express.Router();
const { productController } = require('../controllers');
const { authenticate, requireEditor, validate } = require('../middlewares');
const { feed: validators, customer: customerValidators } = require('../validators');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/admin/customers/:id/products
 * @desc    Get products for a customer with pagination
 * @access  Private (all roles)
 */
router.get(
  '/customers/:id/products',
  validate(customerValidators.customerIdParam),
  productController.getByCustomer
);

/**
 * @route   GET /api/admin/customers/:id/products/search
 * @desc    Search products
 * @access  Private (all roles)
 */
router.get(
  '/customers/:id/products/search',
  validate(customerValidators.customerIdParam),
  productController.search
);

/**
 * @route   GET /api/admin/customers/:id/products/categories
 * @desc    Get unique categories
 * @access  Private (all roles)
 */
router.get(
  '/customers/:id/products/categories',
  validate(customerValidators.customerIdParam),
  productController.getCategories
);

/**
 * @route   GET /api/admin/customers/:id/products/brands
 * @desc    Get unique brands
 * @access  Private (all roles)
 */
router.get(
  '/customers/:id/products/brands',
  validate(customerValidators.customerIdParam),
  productController.getBrands
);

/**
 * @route   GET /api/admin/customers/:id/products/stats
 * @desc    Get product statistics
 * @access  Private (all roles)
 */
router.get(
  '/customers/:id/products/stats',
  validate(customerValidators.customerIdParam),
  productController.getStats
);

/**
 * @route   POST /api/admin/customers/:id/products/update-cache
 * @desc    Update feed cache
 * @access  Private (Admin, Editor)
 */
router.post(
  '/customers/:id/products/update-cache',
  requireEditor,
  validate(customerValidators.customerIdParam),
  productController.updateCache
);

/**
 * @route   GET /api/admin/products/:id
 * @desc    Get product by ID
 * @access  Private (all roles)
 */
router.get('/products/:id', productController.getById);

module.exports = router;
