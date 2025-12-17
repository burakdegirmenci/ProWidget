/**
 * Theme Controller
 * Handles theme management HTTP requests
 *
 * @module controllers/theme
 */

const { themeService } = require('../services');
const { ApiResponse } = require('../utils');
const { asyncHandler } = require('../middlewares');

/**
 * Create new theme for a customer
 * POST /api/admin/customers/:id/theme
 */
const create = asyncHandler(async (req, res) => {
  const theme = await themeService.create(req.params.id, req.body);
  ApiResponse.created(res, theme, 'Theme created successfully');
});

/**
 * Get all themes for a customer
 * GET /api/admin/customers/:id/themes
 */
const getByCustomer = asyncHandler(async (req, res) => {
  const themes = await themeService.getByCustomer(req.params.id, req.query);
  ApiResponse.success(res, themes);
});

/**
 * Get active theme for a customer
 * GET /api/admin/customers/:id/theme
 */
const getActiveTheme = asyncHandler(async (req, res) => {
  const theme = await themeService.getActiveTheme(req.params.id);
  ApiResponse.success(res, theme);
});

/**
 * Get theme by ID
 * GET /api/admin/themes/:id
 */
const getById = asyncHandler(async (req, res) => {
  const theme = await themeService.getById(req.params.id);
  ApiResponse.success(res, theme);
});

/**
 * Update theme
 * PATCH /api/admin/themes/:id
 */
const update = asyncHandler(async (req, res) => {
  const theme = await themeService.update(req.params.id, req.body);
  ApiResponse.success(res, theme, 'Theme updated successfully');
});

/**
 * Delete theme
 * DELETE /api/admin/themes/:id
 */
const remove = asyncHandler(async (req, res) => {
  await themeService.delete(req.params.id);
  ApiResponse.noContent(res);
});

/**
 * Activate theme
 * POST /api/admin/themes/:id/activate
 */
const activate = asyncHandler(async (req, res) => {
  const theme = await themeService.activate(req.params.id);
  ApiResponse.success(res, theme, 'Theme activated successfully');
});

/**
 * Duplicate theme
 * POST /api/admin/themes/:id/duplicate
 */
const duplicate = asyncHandler(async (req, res) => {
  const theme = await themeService.duplicate(req.params.id);
  ApiResponse.created(res, theme, 'Theme duplicated successfully');
});

/**
 * Generate CSS for theme
 * GET /api/admin/themes/:id/css
 */
const generateCss = asyncHandler(async (req, res) => {
  const theme = await themeService.getById(req.params.id);
  const css = themeService.generateCss(theme);
  res.type('text/css').send(css);
});

module.exports = {
  create,
  getByCustomer,
  getActiveTheme,
  getById,
  update,
  remove,
  activate,
  duplicate,
  generateCss
};
