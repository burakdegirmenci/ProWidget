/**
 * Product Controller
 * Handles product data HTTP requests
 *
 * @module controllers/product
 */

const { productService } = require('../services');
const { ApiResponse } = require('../utils');
const { asyncHandler } = require('../middlewares');

/**
 * Get products for a customer with pagination
 * GET /api/admin/customers/:id/products
 */
const getByCustomer = asyncHandler(async (req, res) => {
  const result = await productService.getByCustomer(req.params.id, req.query);
  ApiResponse.paginated(res, result.data, result.pagination);
});

/**
 * Get product by ID
 * GET /api/admin/products/:id
 */
const getById = asyncHandler(async (req, res) => {
  const product = await productService.getById(req.params.id);
  ApiResponse.success(res, product);
});

/**
 * Search products
 * GET /api/admin/customers/:id/products/search
 */
const search = asyncHandler(async (req, res) => {
  const { q, limit } = req.query;
  const products = await productService.search(req.params.id, q, parseInt(limit) || 10);
  ApiResponse.success(res, products);
});

/**
 * Get unique categories for a customer
 * GET /api/admin/customers/:id/products/categories
 */
const getCategories = asyncHandler(async (req, res) => {
  const categories = await productService.getCategories(req.params.id);
  ApiResponse.success(res, categories);
});

/**
 * Get unique brands for a customer
 * GET /api/admin/customers/:id/products/brands
 */
const getBrands = asyncHandler(async (req, res) => {
  const brands = await productService.getBrands(req.params.id);
  ApiResponse.success(res, brands);
});

/**
 * Get product statistics for a customer
 * GET /api/admin/customers/:id/products/stats
 */
const getStats = asyncHandler(async (req, res) => {
  const stats = await productService.getStats(req.params.id);
  ApiResponse.success(res, stats);
});

/**
 * Update feed cache for a customer
 * POST /api/admin/customers/:id/products/update-cache
 */
const updateCache = asyncHandler(async (req, res) => {
  await productService.updateFeedCache(req.params.id);
  ApiResponse.success(res, null, 'Feed cache updated successfully');
});

module.exports = {
  getByCustomer,
  getById,
  search,
  getCategories,
  getBrands,
  getStats,
  updateCache
};
