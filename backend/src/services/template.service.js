/**
 * Template Service
 * Custom template management business logic
 *
 * @module services/template
 */

const { prisma } = require('../models');
const { helpers } = require('../utils');
const { NotFoundError, ValidationError } = require('../exceptions');
const { validateTemplate, sanitizeTemplate } = require('../utils/sanitizer');

class TemplateService {
  /**
   * Create a new custom template
   *
   * @param {string} customerId - Customer ID
   * @param {Object} templateData - Template data
   * @returns {Promise<Object>} Created template
   */
  async create(customerId, templateData) {
    const {
      name,
      description,
      htmlTemplate,
      cssStyles,
      dataSchema,
      defaultData,
      isGlobal,
      isActive
    } = templateData;

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      throw NotFoundError.customer(customerId);
    }

    // Validate template content
    const validation = validateTemplate(htmlTemplate, cssStyles);
    if (!validation.valid) {
      throw new ValidationError('Invalid template content', validation.errors);
    }

    // Sanitize template content
    const sanitized = sanitizeTemplate(htmlTemplate, cssStyles);

    // Parse template variables from HTML
    const variables = this._extractVariables(sanitized.html);

    const template = await prisma.customTemplate.create({
      data: {
        customerId,
        name,
        description,
        htmlTemplate: sanitized.html,
        cssStyles: sanitized.css,
        dataSchema: dataSchema || {},
        defaultData: defaultData || {},
        isGlobal: isGlobal || false,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    return {
      ...template,
      variables,
      sanitizationWarnings: sanitized.warnings
    };
  }

  /**
   * Get template by ID
   *
   * @param {string} id - Template ID
   * @returns {Promise<Object>} Template
   */
  async getById(id) {
    const template = await prisma.customTemplate.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: { widgetConfigs: true }
        }
      }
    });

    if (!template) {
      throw NotFoundError.template(id);
    }

    // Extract variables for reference
    const variables = this._extractVariables(template.htmlTemplate);

    return {
      ...template,
      variables,
      usageCount: template._count.widgetConfigs
    };
  }

  /**
   * Get all templates for a customer
   *
   * @param {string} customerId - Customer ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Templates
   */
  async getByCustomer(customerId, options = {}) {
    const { isActive, includeGlobal = true } = options;

    // Build where clause
    const whereConditions = [{ customerId }];

    // Include global templates if requested
    if (includeGlobal) {
      whereConditions.push({ isGlobal: true });
    }

    const where = {
      OR: whereConditions
    };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const templates = await prisma.customTemplate.findMany({
      where,
      orderBy: [{ isGlobal: 'desc' }, { createdAt: 'desc' }],
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: { widgetConfigs: true }
        }
      }
    });

    return templates.map(template => ({
      ...template,
      usageCount: template._count.widgetConfigs
    }));
  }

  /**
   * Get global templates (shared across customers)
   *
   * @returns {Promise<Array>} Global templates
   */
  async getGlobalTemplates() {
    const templates = await prisma.customTemplate.findMany({
      where: {
        isGlobal: true,
        isActive: true
      },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return templates;
  }

  /**
   * Update template
   *
   * @param {string} id - Template ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated template
   */
  async update(id, updateData) {
    // Check if template exists
    await this.getById(id);

    const {
      name,
      description,
      htmlTemplate,
      cssStyles,
      dataSchema,
      defaultData,
      isGlobal,
      isActive
    } = updateData;

    // If template content is being updated, validate and sanitize
    let sanitized = null;
    if (htmlTemplate || cssStyles) {
      const validation = validateTemplate(
        htmlTemplate || '',
        cssStyles || ''
      );

      if (!validation.valid) {
        throw new ValidationError('Invalid template content', validation.errors);
      }

      sanitized = sanitizeTemplate(
        htmlTemplate || '',
        cssStyles || ''
      );
    }

    const data = helpers.object.removeEmpty({
      name,
      description,
      htmlTemplate: sanitized?.html,
      cssStyles: sanitized?.css,
      dataSchema,
      defaultData,
      isGlobal,
      isActive
    });

    const template = await prisma.customTemplate.update({
      where: { id },
      data,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    // Extract variables
    const variables = this._extractVariables(template.htmlTemplate);

    return {
      ...template,
      variables,
      sanitizationWarnings: sanitized?.warnings || []
    };
  }

  /**
   * Delete template
   *
   * @param {string} id - Template ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    const template = await this.getById(id);

    // Check if template is in use
    const widgetCount = await prisma.widgetConfig.count({
      where: { templateId: id }
    });

    if (widgetCount > 0) {
      throw new ValidationError(
        `Cannot delete template: it is used by ${widgetCount} widget(s)`,
        ['Template is in use']
      );
    }

    await prisma.customTemplate.delete({
      where: { id }
    });
  }

  /**
   * Duplicate template
   *
   * @param {string} id - Template ID to duplicate
   * @param {string} targetCustomerId - Optional target customer ID
   * @returns {Promise<Object>} New template
   */
  async duplicate(id, targetCustomerId = null) {
    const original = await this.getById(id);

    const newTemplate = await prisma.customTemplate.create({
      data: {
        customerId: targetCustomerId || original.customerId,
        name: `${original.name} (Copy)`,
        description: original.description,
        htmlTemplate: original.htmlTemplate,
        cssStyles: original.cssStyles,
        dataSchema: original.dataSchema,
        defaultData: original.defaultData,
        isGlobal: false, // Copies are not global by default
        isActive: false  // Start as inactive
      }
    });

    return newTemplate;
  }

  /**
   * Validate template without saving
   *
   * @param {string} htmlTemplate - HTML template
   * @param {string} cssStyles - CSS styles
   * @returns {Promise<Object>} Validation result
   */
  async validateTemplate(htmlTemplate, cssStyles) {
    const validation = validateTemplate(htmlTemplate, cssStyles);
    const sanitized = sanitizeTemplate(htmlTemplate, cssStyles);
    const variables = this._extractVariables(sanitized.html);

    return {
      valid: validation.valid,
      errors: validation.errors,
      htmlErrors: validation.htmlErrors,
      cssErrors: validation.cssErrors,
      sanitizedHtml: sanitized.html,
      sanitizedCss: sanitized.css,
      sanitizationWarnings: sanitized.warnings,
      variables
    };
  }

  /**
   * Toggle template active status
   *
   * @param {string} id - Template ID
   * @returns {Promise<Object>} Updated template
   */
  async toggleActive(id) {
    const template = await this.getById(id);

    const updated = await prisma.customTemplate.update({
      where: { id },
      data: { isActive: !template.isActive }
    });

    return updated;
  }

  /**
   * Get template for widget rendering (public API)
   *
   * @param {string} templateId - Template ID
   * @returns {Promise<Object>} Template data for rendering
   */
  async getForRendering(templateId) {
    const template = await prisma.customTemplate.findUnique({
      where: { id: templateId },
      select: {
        id: true,
        htmlTemplate: true,
        cssStyles: true,
        dataSchema: true,
        defaultData: true
      }
    });

    if (!template) {
      return null;
    }

    return template;
  }

  /**
   * Extract template variables from HTML
   *
   * @param {string} html - HTML template
   * @returns {Array<string>} List of variable names
   * @private
   */
  _extractVariables(html) {
    if (!html) return [];

    const variables = new Set();

    // Match {{variable}} and {{{variable}}}
    const variablePattern = /\{\{\{?([^{}#\/]+?)\}\}\}?/g;
    let match;

    while ((match = variablePattern.exec(html)) !== null) {
      const variable = match[1].trim();

      // Skip helpers (contain spaces) and special syntax
      if (!variable.includes(' ') && !variable.startsWith('#') && !variable.startsWith('/')) {
        // Get the root variable name
        const rootVar = variable.split('.')[0];
        variables.add(rootVar);
      }
    }

    // Match loop variables: {{#each items}}
    const loopPattern = /\{\{#each\s+(\w+)\}\}/g;
    while ((match = loopPattern.exec(html)) !== null) {
      variables.add(match[1]);
    }

    // Match conditional variables: {{#if condition}}
    const condPattern = /\{\{#(?:if|unless)\s+(\w+)\}\}/g;
    while ((match = condPattern.exec(html)) !== null) {
      variables.add(match[1]);
    }

    return Array.from(variables).sort();
  }
}

// Add NotFoundError.template helper if not exists
if (!NotFoundError.template) {
  NotFoundError.template = (id) => {
    const error = new NotFoundError(`Template not found: ${id}`);
    error.resourceType = 'template';
    error.resourceId = id;
    return error;
  };
}

module.exports = new TemplateService();
