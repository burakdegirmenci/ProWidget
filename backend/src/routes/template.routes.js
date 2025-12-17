/**
 * Template Routes
 * Custom template endpoints
 *
 * @module routes/template
 */

const express = require('express');
const router = express.Router();
const templateController = require('../controllers/template.controller');
const { authenticate, requireEditor, validate } = require('../middlewares');
const templateValidators = require('../validators/template.validator');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/admin/customers/:id/templates
 * @desc    Get all templates for a customer
 * @access  Private (all roles)
 */
router.get(
  '/customers/:id/templates',
  validate(templateValidators.listTemplatesSchema),
  templateController.getByCustomer
);

/**
 * @route   POST /api/admin/customers/:id/templates
 * @desc    Create new template for customer
 * @access  Private (Admin, Editor)
 */
router.post(
  '/customers/:id/templates',
  requireEditor,
  validate(templateValidators.createTemplateSchema),
  templateController.create
);

/**
 * @route   GET /api/admin/templates/global
 * @desc    Get all global templates
 * @access  Private (all roles)
 */
router.get(
  '/templates/global',
  templateController.getGlobalTemplates
);

/**
 * @route   POST /api/admin/templates/validate
 * @desc    Validate template content (for preview)
 * @access  Private (Admin, Editor)
 */
router.post(
  '/templates/validate',
  requireEditor,
  validate(templateValidators.validateTemplateSchema),
  templateController.validateTemplate
);

/**
 * @route   GET /api/admin/templates/:id
 * @desc    Get template by ID
 * @access  Private (all roles)
 */
router.get(
  '/templates/:id',
  validate(templateValidators.templateIdParam),
  templateController.getById
);

/**
 * @route   PATCH /api/admin/templates/:id
 * @desc    Update template
 * @access  Private (Admin, Editor)
 */
router.patch(
  '/templates/:id',
  requireEditor,
  validate(templateValidators.updateTemplateSchema),
  templateController.update
);

/**
 * @route   DELETE /api/admin/templates/:id
 * @desc    Delete template
 * @access  Private (Admin, Editor)
 */
router.delete(
  '/templates/:id',
  requireEditor,
  validate(templateValidators.templateIdParam),
  templateController.remove
);

/**
 * @route   POST /api/admin/templates/:id/duplicate
 * @desc    Duplicate template
 * @access  Private (Admin, Editor)
 */
router.post(
  '/templates/:id/duplicate',
  requireEditor,
  validate(templateValidators.duplicateTemplateSchema),
  templateController.duplicate
);

/**
 * @route   PATCH /api/admin/templates/:id/toggle
 * @desc    Toggle template active status
 * @access  Private (Admin, Editor)
 */
router.patch(
  '/templates/:id/toggle',
  requireEditor,
  validate(templateValidators.templateIdParam),
  templateController.toggleActive
);

module.exports = router;
