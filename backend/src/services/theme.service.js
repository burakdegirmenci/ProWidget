/**
 * Theme Service
 * Theme management business logic
 *
 * @module services/theme
 */

const { prisma } = require('../models');
const { helpers } = require('../utils');
const { NotFoundError } = require('../exceptions');

class ThemeService {
  /**
   * Create a new theme
   *
   * @param {string} customerId - Customer ID
   * @param {Object} themeData - Theme data
   * @returns {Promise<Object>} Created theme
   */
  async create(customerId, themeData) {
    const {
      name,
      primaryColor,
      secondaryColor,
      backgroundColor,
      textColor,
      fontFamily,
      borderRadius,
      cssVariables,
      customCss,
      isActive
    } = themeData;

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      throw NotFoundError.customer(customerId);
    }

    // If this theme should be active, deactivate others
    if (isActive) {
      await prisma.theme.updateMany({
        where: { customerId },
        data: { isActive: false }
      });
    }

    const theme = await prisma.theme.create({
      data: {
        customerId,
        name,
        primaryColor: primaryColor || '#000000',
        secondaryColor: secondaryColor || '#ffffff',
        backgroundColor: backgroundColor || '#ffffff',
        textColor: textColor || '#333333',
        fontFamily: fontFamily || 'inherit',
        borderRadius: borderRadius || '8px',
        cssVariables: cssVariables || {},
        customCss,
        isActive: isActive || false
      }
    });

    return theme;
  }

  /**
   * Get theme by ID
   *
   * @param {string} id - Theme ID
   * @returns {Promise<Object>} Theme
   */
  async getById(id) {
    const theme = await prisma.theme.findUnique({
      where: { id },
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

    if (!theme) {
      throw NotFoundError.theme(id);
    }

    return theme;
  }

  /**
   * Get all themes for a customer
   *
   * @param {string} customerId - Customer ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Themes
   */
  async getByCustomer(customerId, options = {}) {
    const { isActive } = options;

    const where = { customerId };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const themes = await prisma.theme.findMany({
      where,
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }]
    });

    return themes;
  }

  /**
   * Get active theme for a customer
   *
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object|null>} Active theme or null
   */
  async getActiveTheme(customerId) {
    const theme = await prisma.theme.findFirst({
      where: {
        customerId,
        isActive: true
      }
    });

    return theme;
  }

  /**
   * Get theme for public API (formatted for widget use)
   *
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Theme data for widgets
   */
  async getThemeForWidget(customerId) {
    const theme = await this.getActiveTheme(customerId);

    if (!theme) {
      // Return default theme
      return {
        primaryColor: '#000000',
        secondaryColor: '#ffffff',
        backgroundColor: '#ffffff',
        textColor: '#333333',
        fontFamily: 'inherit',
        borderRadius: '8px',
        cssVariables: {}
      };
    }

    return {
      primaryColor: theme.primaryColor,
      secondaryColor: theme.secondaryColor,
      backgroundColor: theme.backgroundColor,
      textColor: theme.textColor,
      fontFamily: theme.fontFamily,
      borderRadius: theme.borderRadius,
      cssVariables: theme.cssVariables,
      customCss: theme.customCss
    };
  }

  /**
   * Update theme
   *
   * @param {string} id - Theme ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated theme
   */
  async update(id, updateData) {
    // Check if theme exists
    const existing = await this.getById(id);

    const {
      name,
      primaryColor,
      secondaryColor,
      backgroundColor,
      textColor,
      fontFamily,
      borderRadius,
      cssVariables,
      customCss,
      isActive
    } = updateData;

    // If activating this theme, deactivate others
    if (isActive === true) {
      await prisma.theme.updateMany({
        where: {
          customerId: existing.customerId,
          NOT: { id }
        },
        data: { isActive: false }
      });
    }

    // Merge CSS variables if provided
    let finalCssVariables = cssVariables;
    if (cssVariables) {
      finalCssVariables = helpers.object.deepMerge(
        existing.cssVariables,
        cssVariables
      );
    }

    const theme = await prisma.theme.update({
      where: { id },
      data: helpers.object.removeEmpty({
        name,
        primaryColor,
        secondaryColor,
        backgroundColor,
        textColor,
        fontFamily,
        borderRadius,
        cssVariables: finalCssVariables,
        customCss,
        isActive
      })
    });

    return theme;
  }

  /**
   * Delete theme
   *
   * @param {string} id - Theme ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    // Check if theme exists
    await this.getById(id);

    await prisma.theme.delete({
      where: { id }
    });
  }

  /**
   * Activate theme (and deactivate others)
   *
   * @param {string} id - Theme ID
   * @returns {Promise<Object>} Activated theme
   */
  async activate(id) {
    const theme = await this.getById(id);

    // Deactivate all other themes for this customer
    await prisma.theme.updateMany({
      where: {
        customerId: theme.customerId,
        NOT: { id }
      },
      data: { isActive: false }
    });

    // Activate this theme
    const updated = await prisma.theme.update({
      where: { id },
      data: { isActive: true }
    });

    return updated;
  }

  /**
   * Duplicate theme
   *
   * @param {string} id - Theme ID to duplicate
   * @returns {Promise<Object>} New theme
   */
  async duplicate(id) {
    const original = await this.getById(id);

    const theme = await prisma.theme.create({
      data: {
        customerId: original.customerId,
        name: `${original.name} (Copy)`,
        primaryColor: original.primaryColor,
        secondaryColor: original.secondaryColor,
        backgroundColor: original.backgroundColor,
        textColor: original.textColor,
        fontFamily: original.fontFamily,
        borderRadius: original.borderRadius,
        cssVariables: original.cssVariables,
        customCss: original.customCss,
        isActive: false
      }
    });

    return theme;
  }

  /**
   * Generate CSS from theme
   *
   * @param {Object} theme - Theme object
   * @returns {string} Generated CSS
   */
  generateCss(theme) {
    let css = `:root {\n`;
    css += `  --pwx-primary: ${theme.primaryColor};\n`;
    css += `  --pwx-secondary: ${theme.secondaryColor};\n`;
    css += `  --pwx-background: ${theme.backgroundColor};\n`;
    css += `  --pwx-text: ${theme.textColor};\n`;
    css += `  --pwx-font-family: ${theme.fontFamily};\n`;
    css += `  --pwx-border-radius: ${theme.borderRadius};\n`;

    // Add custom CSS variables
    if (theme.cssVariables && typeof theme.cssVariables === 'object') {
      Object.entries(theme.cssVariables).forEach(([key, value]) => {
        css += `  ${key}: ${value};\n`;
      });
    }

    css += `}\n`;

    // Add custom CSS if present
    if (theme.customCss) {
      css += `\n/* Custom CSS */\n${theme.customCss}`;
    }

    return css;
  }
}

module.exports = new ThemeService();
