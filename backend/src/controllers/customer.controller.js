/**
 * Customer Controller
 * Handles customer management HTTP requests
 *
 * @module controllers/customer
 */

const { customerService } = require('../services');
const { ApiResponse } = require('../utils');
const { asyncHandler } = require('../middlewares');

/**
 * Create new customer
 * POST /api/admin/customers
 */
const create = asyncHandler(async (req, res) => {
  const customer = await customerService.create(req.body);
  ApiResponse.created(res, customer, 'Customer created successfully');
});

/**
 * Get all customers with pagination
 * GET /api/admin/customers
 */
const getAll = asyncHandler(async (req, res) => {
  const result = await customerService.getAll(req.query);
  ApiResponse.paginated(res, result.data, result.pagination);
});

/**
 * Get customer by ID
 * GET /api/admin/customers/:id
 */
const getById = asyncHandler(async (req, res) => {
  const customer = await customerService.getById(req.params.id);
  ApiResponse.success(res, customer);
});

/**
 * Update customer
 * PATCH /api/admin/customers/:id
 */
const update = asyncHandler(async (req, res) => {
  const customer = await customerService.update(req.params.id, req.body);
  ApiResponse.success(res, customer, 'Customer updated successfully');
});

/**
 * Delete customer
 * DELETE /api/admin/customers/:id
 */
const remove = asyncHandler(async (req, res) => {
  await customerService.delete(req.params.id);
  ApiResponse.noContent(res);
});

/**
 * Regenerate API key
 * POST /api/admin/customers/:id/regenerate-key
 */
const regenerateApiKey = asyncHandler(async (req, res) => {
  const customer = await customerService.regenerateApiKey(req.params.id);
  ApiResponse.success(res, customer, 'API key regenerated successfully');
});

/**
 * Get customer statistics
 * GET /api/admin/customers/:id/stats
 */
const getStats = asyncHandler(async (req, res) => {
  const stats = await customerService.getStats(req.params.id);
  ApiResponse.success(res, stats);
});

/**
 * Check if slug is available
 * GET /api/admin/customers/check-slug/:slug
 */
const checkSlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { excludeId } = req.query;
  const available = await customerService.isSlugAvailable(slug, excludeId);
  ApiResponse.success(res, { slug, available });
});

module.exports = {
  create,
  getAll,
  getById,
  update,
  remove,
  regenerateApiKey,
  getStats,
  checkSlug
};
