/**
 * Widget Service
 * Widget configuration management business logic
 *
 * @module services/widget
 */

const { prisma } = require('../models');
const { helpers } = require('../utils');
const { NotFoundError } = require('../exceptions');

class WidgetService {
  /**
   * Create a new widget configuration
   *
   * @param {string} customerId - Customer ID
   * @param {Object} widgetData - Widget data
   * @returns {Promise<Object>} Created widget
   */
  async create(customerId, widgetData) {
    const { type, name, settings, placement, isActive, priority, templateId, customData } = widgetData;

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      throw NotFoundError.customer(customerId);
    }

    // For custom widgets, verify template exists if templateId provided
    if (type === 'custom' && templateId) {
      const template = await prisma.customTemplate.findUnique({
        where: { id: templateId }
      });

      if (!template) {
        throw new NotFoundError('Template not found', templateId);
      }

      // Verify template belongs to same customer or is global
      if (template.customerId !== customerId && !template.isGlobal) {
        throw new NotFoundError('Template not accessible', templateId);
      }
    }

    const widget = await prisma.widgetConfig.create({
      data: {
        customerId,
        type,
        name,
        settings: settings || {},
        placement,
        isActive: isActive !== undefined ? isActive : true,
        priority: priority || 0,
        templateId: type === 'custom' ? templateId : null,
        customData: type === 'custom' ? (customData || {}) : null
      },
      include: {
        template: type === 'custom' ? true : false
      }
    });

    return widget;
  }

  /**
   * Get widget by ID
   *
   * @param {string} id - Widget ID
   * @returns {Promise<Object>} Widget
   */
  async getById(id) {
    const widget = await prisma.widgetConfig.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        template: true
      }
    });

    if (!widget) {
      throw NotFoundError.widget(id);
    }

    return widget;
  }

  /**
   * Get all widgets for a customer
   *
   * @param {string} customerId - Customer ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Widgets
   */
  async getByCustomer(customerId, options = {}) {
    const { type, isActive } = options;

    // Build where clause
    const where = { customerId };

    if (type) {
      where.type = type;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const widgets = await prisma.widgetConfig.findMany({
      where,
      include: {
        template: true
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }]
    });

    return widgets;
  }

  /**
   * Get active widgets for a customer (for public API)
   *
   * @param {string} customerId - Customer ID
   * @returns {Promise<Array>} Active widgets
   */
  async getActiveWidgets(customerId) {
    const widgets = await prisma.widgetConfig.findMany({
      where: {
        customerId,
        isActive: true
      },
      orderBy: { priority: 'desc' },
      select: {
        id: true,
        type: true,
        name: true,
        settings: true,
        placement: true,
        priority: true,
        templateId: true,
        customData: true,
        template: {
          select: {
            id: true,
            htmlTemplate: true,
            cssStyles: true,
            dataSchema: true,
            defaultData: true
          }
        }
      }
    });

    return widgets;
  }

  /**
   * Update widget
   *
   * @param {string} id - Widget ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated widget
   */
  async update(id, updateData) {
    // Check if widget exists
    const existingWidget = await this.getById(id);

    const { name, settings, placement, isActive, priority, templateId, customData } = updateData;

    // If settings provided, merge with existing
    let finalSettings = settings;
    if (settings) {
      const existing = await prisma.widgetConfig.findUnique({
        where: { id },
        select: { settings: true }
      });
      finalSettings = helpers.object.deepMerge(existing.settings, settings);
    }

    // If customData provided and widget is custom type, merge with existing
    let finalCustomData = customData;
    if (customData && existingWidget.type === 'custom') {
      const existing = await prisma.widgetConfig.findUnique({
        where: { id },
        select: { customData: true }
      });
      finalCustomData = helpers.object.deepMerge(existing.customData || {}, customData);
    }

    // Verify template exists if updating templateId for custom widget
    if (templateId && existingWidget.type === 'custom') {
      const template = await prisma.customTemplate.findUnique({
        where: { id: templateId }
      });

      if (!template) {
        throw new NotFoundError('Template not found', templateId);
      }

      // Verify template belongs to same customer or is global
      if (template.customerId !== existingWidget.customerId && !template.isGlobal) {
        throw new NotFoundError('Template not accessible', templateId);
      }
    }

    const updatePayload = helpers.object.removeEmpty({
      name,
      settings: finalSettings,
      placement,
      isActive,
      priority
    });

    // Only update templateId/customData for custom widgets
    if (existingWidget.type === 'custom') {
      if (templateId !== undefined) updatePayload.templateId = templateId;
      if (finalCustomData !== undefined) updatePayload.customData = finalCustomData;
    }

    const widget = await prisma.widgetConfig.update({
      where: { id },
      data: updatePayload,
      include: {
        template: true
      }
    });

    return widget;
  }

  /**
   * Delete widget
   *
   * @param {string} id - Widget ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    // Check if widget exists
    await this.getById(id);

    await prisma.widgetConfig.delete({
      where: { id }
    });
  }

  /**
   * Duplicate widget
   *
   * @param {string} id - Widget ID to duplicate
   * @returns {Promise<Object>} New widget
   */
  async duplicate(id) {
    const original = await this.getById(id);

    const widget = await prisma.widgetConfig.create({
      data: {
        customerId: original.customerId,
        type: original.type,
        name: `${original.name} (Copy)`,
        settings: original.settings,
        placement: original.placement,
        isActive: false, // Start as inactive
        priority: original.priority,
        templateId: original.templateId,
        customData: original.customData
      },
      include: {
        template: true
      }
    });

    return widget;
  }

  /**
   * Toggle widget active status
   *
   * @param {string} id - Widget ID
   * @returns {Promise<Object>} Updated widget
   */
  async toggleActive(id) {
    const widget = await this.getById(id);

    const updated = await prisma.widgetConfig.update({
      where: { id },
      data: { isActive: !widget.isActive }
    });

    return updated;
  }

  /**
   * Update widget priority
   *
   * @param {string} id - Widget ID
   * @param {number} priority - New priority
   * @returns {Promise<Object>} Updated widget
   */
  async updatePriority(id, priority) {
    const widget = await prisma.widgetConfig.update({
      where: { id },
      data: { priority }
    });

    return widget;
  }

  /**
   * Reorder widgets for a customer
   *
   * @param {string} customerId - Customer ID
   * @param {Array} widgetIds - Ordered array of widget IDs
   * @returns {Promise<void>}
   */
  async reorder(customerId, widgetIds) {
    const updates = widgetIds.map((id, index) =>
      prisma.widgetConfig.update({
        where: { id },
        data: { priority: widgetIds.length - index }
      })
    );

    await prisma.$transaction(updates);
  }

  /**
   * Get widget count by type for a customer
   *
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Widget counts by type
   */
  async getCountByType(customerId) {
    const counts = await prisma.widgetConfig.groupBy({
      by: ['type'],
      where: { customerId },
      _count: true
    });

    return counts.reduce((acc, item) => {
      acc[item.type] = item._count;
      return acc;
    }, {});
  }
}

module.exports = new WidgetService();
