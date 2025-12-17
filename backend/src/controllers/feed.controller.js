/**
 * Feed Controller
 * Handles XML feed management HTTP requests
 *
 * @module controllers/feed
 */

const { feedService, productService } = require('../services');
const { ApiResponse } = require('../utils');
const { asyncHandler } = require('../middlewares');

/**
 * Create new feed for a customer
 * POST /api/admin/customers/:id/feeds
 */
const create = asyncHandler(async (req, res) => {
  const feed = await feedService.create(req.params.id, req.body);
  ApiResponse.created(res, feed, 'Feed created successfully');
});

/**
 * Get all feeds for a customer
 * GET /api/admin/customers/:id/feeds
 */
const getByCustomer = asyncHandler(async (req, res) => {
  const feeds = await feedService.getByCustomer(req.params.id, req.query);
  ApiResponse.success(res, feeds);
});

/**
 * Get feed by ID
 * GET /api/admin/feeds/:id
 */
const getById = asyncHandler(async (req, res) => {
  const feed = await feedService.getById(req.params.id);
  ApiResponse.success(res, feed);
});

/**
 * Update feed
 * PATCH /api/admin/feeds/:id
 */
const update = asyncHandler(async (req, res) => {
  const feed = await feedService.update(req.params.id, req.body);
  ApiResponse.success(res, feed, 'Feed updated successfully');
});

/**
 * Delete feed
 * DELETE /api/admin/feeds/:id
 */
const remove = asyncHandler(async (req, res) => {
  await feedService.delete(req.params.id);
  ApiResponse.noContent(res);
});

/**
 * Trigger manual sync
 * POST /api/admin/feeds/:id/sync
 */
const triggerSync = asyncHandler(async (req, res) => {
  const feed = await feedService.triggerSync(req.params.id);
  ApiResponse.success(res, feed, 'Sync triggered successfully');
});

/**
 * Get feed statistics
 * GET /api/admin/customers/:id/feeds/stats
 */
const getStats = asyncHandler(async (req, res) => {
  const stats = await feedService.getStats(req.params.id);
  ApiResponse.success(res, stats);
});

/**
 * Get products for a feed
 * GET /api/admin/feeds/:id/products
 */
const getProducts = asyncHandler(async (req, res) => {
  const feed = await feedService.getById(req.params.id);
  const result = await productService.getByCustomer(feed.customerId, {
    ...req.query,
    feedId: req.params.id
  });
  ApiResponse.paginated(res, result.data, result.pagination);
});

module.exports = {
  create,
  getByCustomer,
  getById,
  update,
  remove,
  triggerSync,
  getStats,
  getProducts
};
