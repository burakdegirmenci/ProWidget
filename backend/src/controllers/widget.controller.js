/**
 * Widget Controller
 * Handles widget configuration HTTP requests
 *
 * @module controllers/widget
 */

const { widgetService } = require('../services');
const { ApiResponse } = require('../utils');
const { asyncHandler } = require('../middlewares');

/**
 * Create new widget for a customer
 * POST /api/admin/customers/:id/widgets
 */
const create = asyncHandler(async (req, res) => {
  const widget = await widgetService.create(req.params.id, req.body);
  ApiResponse.created(res, widget, 'Widget created successfully');
});

/**
 * Get all widgets for a customer
 * GET /api/admin/customers/:id/widgets
 */
const getByCustomer = asyncHandler(async (req, res) => {
  const widgets = await widgetService.getByCustomer(req.params.id, req.query);
  ApiResponse.success(res, widgets);
});

/**
 * Get widget by ID
 * GET /api/admin/widgets/:id
 */
const getById = asyncHandler(async (req, res) => {
  const widget = await widgetService.getById(req.params.id);
  ApiResponse.success(res, widget);
});

/**
 * Update widget
 * PATCH /api/admin/widgets/:id
 */
const update = asyncHandler(async (req, res) => {
  const widget = await widgetService.update(req.params.id, req.body);
  ApiResponse.success(res, widget, 'Widget updated successfully');
});

/**
 * Delete widget
 * DELETE /api/admin/widgets/:id
 */
const remove = asyncHandler(async (req, res) => {
  await widgetService.delete(req.params.id);
  ApiResponse.noContent(res);
});

/**
 * Duplicate widget
 * POST /api/admin/widgets/:id/duplicate
 */
const duplicate = asyncHandler(async (req, res) => {
  const widget = await widgetService.duplicate(req.params.id);
  ApiResponse.created(res, widget, 'Widget duplicated successfully');
});

/**
 * Toggle widget active status
 * PATCH /api/admin/widgets/:id/toggle
 */
const toggleActive = asyncHandler(async (req, res) => {
  const widget = await widgetService.toggleActive(req.params.id);
  ApiResponse.success(res, widget, `Widget ${widget.isActive ? 'activated' : 'deactivated'}`);
});

/**
 * Update widget priority
 * PATCH /api/admin/widgets/:id/priority
 */
const updatePriority = asyncHandler(async (req, res) => {
  const { priority } = req.body;
  const widget = await widgetService.updatePriority(req.params.id, priority);
  ApiResponse.success(res, widget, 'Widget priority updated');
});

/**
 * Reorder widgets
 * POST /api/admin/customers/:id/widgets/reorder
 */
const reorder = asyncHandler(async (req, res) => {
  const { widgetIds } = req.body;
  await widgetService.reorder(req.params.id, widgetIds);
  ApiResponse.success(res, null, 'Widgets reordered successfully');
});

/**
 * Get widget count by type
 * GET /api/admin/customers/:id/widgets/count
 */
const getCountByType = asyncHandler(async (req, res) => {
  const counts = await widgetService.getCountByType(req.params.id);
  ApiResponse.success(res, counts);
});

module.exports = {
  create,
  getByCustomer,
  getById,
  update,
  remove,
  duplicate,
  toggleActive,
  updatePriority,
  reorder,
  getCountByType
};
