/**
 * Template Controller
 * Handles custom template HTTP requests
 *
 * @module controllers/template
 */

const templateService = require('../services/template.service');
const { ApiResponse } = require('../utils');
const { asyncHandler } = require('../middlewares');

/**
 * Create new template for a customer
 * POST /api/admin/customers/:id/templates
 */
const create = asyncHandler(async (req, res) => {
  const template = await templateService.create(req.params.id, req.body);
  ApiResponse.created(res, template, 'Template created successfully');
});

/**
 * Get all templates for a customer
 * GET /api/admin/customers/:id/templates
 */
const getByCustomer = asyncHandler(async (req, res) => {
  const templates = await templateService.getByCustomer(req.params.id, req.query);
  ApiResponse.success(res, templates);
});

/**
 * Get global templates
 * GET /api/admin/templates/global
 */
const getGlobalTemplates = asyncHandler(async (req, res) => {
  const templates = await templateService.getGlobalTemplates();
  ApiResponse.success(res, templates);
});

/**
 * Get template by ID
 * GET /api/admin/templates/:id
 */
const getById = asyncHandler(async (req, res) => {
  const template = await templateService.getById(req.params.id);
  ApiResponse.success(res, template);
});

/**
 * Update template
 * PATCH /api/admin/templates/:id
 */
const update = asyncHandler(async (req, res) => {
  const template = await templateService.update(req.params.id, req.body);
  ApiResponse.success(res, template, 'Template updated successfully');
});

/**
 * Delete template
 * DELETE /api/admin/templates/:id
 */
const remove = asyncHandler(async (req, res) => {
  await templateService.delete(req.params.id);
  ApiResponse.noContent(res);
});

/**
 * Duplicate template
 * POST /api/admin/templates/:id/duplicate
 */
const duplicate = asyncHandler(async (req, res) => {
  const targetCustomerId = req.body?.targetCustomerId || null;
  const template = await templateService.duplicate(req.params.id, targetCustomerId);
  ApiResponse.created(res, template, 'Template duplicated successfully');
});

/**
 * Validate template content (for preview)
 * POST /api/admin/templates/validate
 */
const validateTemplate = asyncHandler(async (req, res) => {
  const { htmlTemplate, cssStyles } = req.body;
  const result = await templateService.validateTemplate(htmlTemplate, cssStyles);
  ApiResponse.success(res, result);
});

/**
 * Toggle template active status
 * PATCH /api/admin/templates/:id/toggle
 */
const toggleActive = asyncHandler(async (req, res) => {
  const template = await templateService.toggleActive(req.params.id);
  ApiResponse.success(res, template, `Template ${template.isActive ? 'activated' : 'deactivated'}`);
});

module.exports = {
  create,
  getByCustomer,
  getGlobalTemplates,
  getById,
  update,
  remove,
  duplicate,
  validateTemplate,
  toggleActive
};
