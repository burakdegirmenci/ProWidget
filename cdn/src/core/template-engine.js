/**
 * Template Engine
 * Handlebars-style template rendering engine for custom widgets
 *
 * @module core/template-engine
 */

import { escapeHtml, formatPrice, logger } from './utils.js';

/**
 * Built-in template helpers
 */
const DEFAULT_HELPERS = {
  /**
   * Format price with currency
   * Usage: {{formatPrice price}}
   */
  formatPrice: (value, currency = 'TRY', locale = 'tr-TR') => {
    if (value === null || value === undefined) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return formatPrice(num, currency, locale);
  },

  /**
   * Format date
   * Usage: {{formatDate date "DD.MM.YYYY"}}
   */
  formatDate: (value, format = 'DD.MM.YYYY') => {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return format
      .replace('DD', day)
      .replace('MM', month)
      .replace('YYYY', year)
      .replace('HH', hours)
      .replace('mm', minutes);
  },

  /**
   * Truncate text
   * Usage: {{truncate text 100}}
   */
  truncate: (value, length = 100, suffix = '...') => {
    if (!value) return '';
    const str = String(value);
    if (str.length <= length) return str;
    return str.substring(0, length).trim() + suffix;
  },

  /**
   * Uppercase text
   * Usage: {{uppercase text}}
   */
  uppercase: (value) => {
    if (!value) return '';
    return String(value).toUpperCase();
  },

  /**
   * Lowercase text
   * Usage: {{lowercase text}}
   */
  lowercase: (value) => {
    if (!value) return '';
    return String(value).toLowerCase();
  },

  /**
   * Capitalize first letter
   * Usage: {{capitalize text}}
   */
  capitalize: (value) => {
    if (!value) return '';
    const str = String(value);
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  /**
   * Calculate countdown
   * Usage: {{countdown targetDate}}
   */
  countdown: (targetDate) => {
    if (!targetDate) return '';
    const target = new Date(targetDate);
    const now = new Date();
    const diff = target - now;

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 && days === 0) parts.push(`${seconds}s`);

    return parts.join(' ') || '0s';
  },

  /**
   * Calculate discount percentage
   * Usage: {{discount originalPrice salePrice}}
   */
  discount: (originalPrice, salePrice) => {
    const original = parseFloat(originalPrice);
    const sale = parseFloat(salePrice);
    if (isNaN(original) || isNaN(sale) || original <= 0) return 0;
    return Math.round((1 - sale / original) * 100);
  },

  /**
   * Default value if empty
   * Usage: {{default value "N/A"}}
   */
  default: (value, defaultValue = '') => {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    return value;
  },

  /**
   * JSON stringify
   * Usage: {{json object}}
   */
  json: (value) => {
    try {
      return JSON.stringify(value);
    } catch {
      return '';
    }
  },

  /**
   * Math operations
   */
  add: (a, b) => parseFloat(a) + parseFloat(b),
  subtract: (a, b) => parseFloat(a) - parseFloat(b),
  multiply: (a, b) => parseFloat(a) * parseFloat(b),
  divide: (a, b) => parseFloat(b) !== 0 ? parseFloat(a) / parseFloat(b) : 0,

  /**
   * Comparison helpers for use in conditions
   */
  eq: (a, b) => a === b,
  neq: (a, b) => a !== b,
  lt: (a, b) => parseFloat(a) < parseFloat(b),
  lte: (a, b) => parseFloat(a) <= parseFloat(b),
  gt: (a, b) => parseFloat(a) > parseFloat(b),
  gte: (a, b) => parseFloat(a) >= parseFloat(b),
  and: (a, b) => a && b,
  or: (a, b) => a || b,
  not: (a) => !a
};

/**
 * Template Engine Class
 * Provides Handlebars-style template rendering
 */
class TemplateEngine {
  /**
   * Create template engine instance
   *
   * @param {string} template - HTML template string
   * @param {Object} options - Engine options
   */
  constructor(template, options = {}) {
    this.template = template || '';
    this.helpers = { ...DEFAULT_HELPERS };
    this.options = {
      escapeHtml: true,
      strict: false,
      ...options
    };

    // Register custom helpers
    if (options.helpers) {
      Object.entries(options.helpers).forEach(([name, fn]) => {
        this.registerHelper(name, fn);
      });
    }
  }

  /**
   * Register a custom helper function
   *
   * @param {string} name - Helper name
   * @param {Function} fn - Helper function
   */
  registerHelper(name, fn) {
    if (typeof fn !== 'function') {
      throw new Error(`Helper "${name}" must be a function`);
    }
    this.helpers[name] = fn;
  }

  /**
   * Render template with data
   *
   * @param {Object} data - Data context
   * @returns {string} Rendered HTML
   */
  render(data = {}) {
    try {
      let html = this.template;

      // Process block helpers ({{#each}}, {{#if}}, etc.)
      html = this._processBlocks(html, data);

      // Process variable interpolation
      html = this._processVariables(html, data);

      return html;
    } catch (error) {
      logger.error('Template rendering error:', error.message);
      if (this.options.strict) {
        throw error;
      }
      return `<!-- Template Error: ${escapeHtml(error.message)} -->`;
    }
  }

  /**
   * Process block helpers ({{#each}}, {{#if}}, {{#unless}})
   *
   * @param {string} html - Template HTML
   * @param {Object} data - Data context
   * @returns {string} Processed HTML
   */
  _processBlocks(html, data) {
    // Process {{#each items}}...{{/each}}
    html = this._processEach(html, data);

    // Process {{#if condition}}...{{else}}...{{/if}}
    html = this._processIf(html, data);

    // Process {{#unless condition}}...{{/unless}}
    html = this._processUnless(html, data);

    // Process {{#with object}}...{{/with}}
    html = this._processWith(html, data);

    return html;
  }

  /**
   * Process {{#each}} blocks
   */
  _processEach(html, data) {
    const eachRegex = /\{\{#each\s+([^\}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;

    return html.replace(eachRegex, (match, path, content) => {
      const items = this._getValueByPath(data, path.trim());

      if (!Array.isArray(items) || items.length === 0) {
        return '';
      }

      return items.map((item, index) => {
        // Create context with special variables
        const context = {
          ...data,
          this: item,
          '@index': index,
          '@first': index === 0,
          '@last': index === items.length - 1,
          '@length': items.length
        };

        // If item is an object, spread its properties
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          Object.assign(context, item);
        }

        // Recursively process nested blocks
        let result = this._processBlocks(content, context);
        result = this._processVariables(result, context);

        return result;
      }).join('');
    });
  }

  /**
   * Process {{#if}} blocks
   */
  _processIf(html, data) {
    // Match {{#if condition}}...{{else}}...{{/if}} or {{#if condition}}...{{/if}}
    const ifRegex = /\{\{#if\s+([^\}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;

    return html.replace(ifRegex, (match, condition, content) => {
      // Check for {{else}}
      const parts = content.split(/\{\{else\}\}/);
      const truthy = parts[0];
      const falsy = parts[1] || '';

      // Evaluate condition
      const result = this._evaluateCondition(condition.trim(), data);

      let output = result ? truthy : falsy;

      // Recursively process nested blocks
      output = this._processBlocks(output, data);
      output = this._processVariables(output, data);

      return output;
    });
  }

  /**
   * Process {{#unless}} blocks
   */
  _processUnless(html, data) {
    const unlessRegex = /\{\{#unless\s+([^\}]+)\}\}([\s\S]*?)\{\{\/unless\}\}/g;

    return html.replace(unlessRegex, (match, condition, content) => {
      const parts = content.split(/\{\{else\}\}/);
      const falsy = parts[0];
      const truthy = parts[1] || '';

      const result = this._evaluateCondition(condition.trim(), data);

      let output = result ? truthy : falsy;

      output = this._processBlocks(output, data);
      output = this._processVariables(output, data);

      return output;
    });
  }

  /**
   * Process {{#with}} blocks
   */
  _processWith(html, data) {
    const withRegex = /\{\{#with\s+([^\}]+)\}\}([\s\S]*?)\{\{\/with\}\}/g;

    return html.replace(withRegex, (match, path, content) => {
      const context = this._getValueByPath(data, path.trim());

      if (!context || typeof context !== 'object') {
        return '';
      }

      const newData = { ...data, ...context, this: context };

      let output = this._processBlocks(content, newData);
      output = this._processVariables(output, newData);

      return output;
    });
  }

  /**
   * Evaluate a condition expression
   */
  _evaluateCondition(condition, data) {
    // Check if it's a helper call
    const helperMatch = condition.match(/^(\w+)\s+(.*)$/);
    if (helperMatch && this.helpers[helperMatch[1]]) {
      const helperName = helperMatch[1];
      const argsString = helperMatch[2];

      // Parse helper arguments
      const args = this._parseHelperArgs(argsString, data);
      return this.helpers[helperName](...args);
    }

    // Simple value check
    const value = this._getValueByPath(data, condition);
    return this._isTruthy(value);
  }

  /**
   * Check if a value is truthy
   */
  _isTruthy(value) {
    if (Array.isArray(value)) return value.length > 0;
    if (value === 0) return true; // 0 is truthy in templates
    return !!value;
  }

  /**
   * Process variable interpolation
   *
   * @param {string} html - Template HTML
   * @param {Object} data - Data context
   * @returns {string} Processed HTML
   */
  _processVariables(html, data) {
    // Process {{{raw}}} - unescaped output
    html = html.replace(/\{\{\{([^\}]+)\}\}\}/g, (match, expression) => {
      const value = this._evaluateExpression(expression.trim(), data);
      return value !== null && value !== undefined ? String(value) : '';
    });

    // Process {{escaped}} - escaped output
    html = html.replace(/\{\{([^\}#\/]+)\}\}/g, (match, expression) => {
      const value = this._evaluateExpression(expression.trim(), data);

      if (value === null || value === undefined) {
        return '';
      }

      const str = String(value);
      return this.options.escapeHtml ? escapeHtml(str) : str;
    });

    return html;
  }

  /**
   * Evaluate an expression (variable or helper call)
   */
  _evaluateExpression(expression, data) {
    // Check if it's a helper call (e.g., "formatPrice product.price")
    const parts = expression.match(/^(\w+)\s+(.+)$/);

    if (parts && this.helpers[parts[1]]) {
      const helperName = parts[1];
      const argsString = parts[2];

      // Parse helper arguments
      const args = this._parseHelperArgs(argsString, data);
      return this.helpers[helperName](...args);
    }

    // Simple variable
    return this._getValueByPath(data, expression);
  }

  /**
   * Parse helper arguments
   */
  _parseHelperArgs(argsString, data) {
    const args = [];
    const argRegex = /(?:"([^"]*)"|'([^']*)'|(\S+))/g;
    let match;

    while ((match = argRegex.exec(argsString)) !== null) {
      // String literal (double or single quotes)
      if (match[1] !== undefined) {
        args.push(match[1]);
      } else if (match[2] !== undefined) {
        args.push(match[2]);
      } else {
        // Variable path or number
        const arg = match[3];
        if (/^-?\d+(\.\d+)?$/.test(arg)) {
          args.push(parseFloat(arg));
        } else if (arg === 'true') {
          args.push(true);
        } else if (arg === 'false') {
          args.push(false);
        } else if (arg === 'null') {
          args.push(null);
        } else {
          args.push(this._getValueByPath(data, arg));
        }
      }
    }

    return args;
  }

  /**
   * Get value from data by dot-notation path
   *
   * @param {Object} data - Data object
   * @param {string} path - Dot-notation path (e.g., "product.title")
   * @returns {any} Value at path
   */
  _getValueByPath(data, path) {
    if (!path || !data) return undefined;

    // Handle "this" keyword
    if (path === 'this') {
      return data.this || data;
    }

    // Handle @ variables
    if (path.startsWith('@')) {
      return data[path];
    }

    // Split path and traverse
    const parts = path.split('.');
    let current = data;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }

      // Handle array index notation (e.g., "items[0]")
      const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        current = current[arrayMatch[1]];
        if (Array.isArray(current)) {
          current = current[parseInt(arrayMatch[2], 10)];
        } else {
          return undefined;
        }
      } else {
        current = current[part];
      }
    }

    return current;
  }

  /**
   * Extract all variable names from template
   * Useful for validation and debugging
   *
   * @returns {Array<string>} Array of variable names
   */
  getVariables() {
    const variables = new Set();

    // Match {{variable}} and {{{variable}}}
    const varRegex = /\{\{+([^\}#\/][^\}]*)\}\}+/g;
    let match;

    while ((match = varRegex.exec(this.template)) !== null) {
      const expression = match[1].trim();

      // Skip helpers with arguments
      const parts = expression.split(/\s+/);
      if (parts.length === 1) {
        variables.add(parts[0]);
      } else if (!this.helpers[parts[0]]) {
        variables.add(parts[0]);
      } else {
        // Add helper arguments that look like variables
        parts.slice(1).forEach(part => {
          if (!part.startsWith('"') && !part.startsWith("'") && !/^\d/.test(part)) {
            variables.add(part);
          }
        });
      }
    }

    // Match {{#each variable}}
    const blockRegex = /\{\{#(each|if|unless|with)\s+([^\}]+)\}\}/g;
    while ((match = blockRegex.exec(this.template)) !== null) {
      const path = match[2].trim().split(/\s+/)[0];
      variables.add(path);
    }

    return Array.from(variables);
  }

  /**
   * Validate template syntax
   *
   * @returns {Object} Validation result { valid, errors }
   */
  validate() {
    const errors = [];

    // Check for unclosed blocks
    const blocks = ['each', 'if', 'unless', 'with'];
    blocks.forEach(block => {
      const openCount = (this.template.match(new RegExp(`\\{\\{#${block}`, 'g')) || []).length;
      const closeCount = (this.template.match(new RegExp(`\\{\\{\\/${block}\\}\\}`, 'g')) || []).length;

      if (openCount !== closeCount) {
        errors.push(`Unclosed {{#${block}}} block: ${openCount} opened, ${closeCount} closed`);
      }
    });

    // Check for unmatched braces
    const openBraces = (this.template.match(/\{\{(?!\{)/g) || []).length;
    const closeBraces = (this.template.match(/\}\}(?!\})/g) || []).length;

    if (openBraces !== closeBraces) {
      errors.push(`Unmatched braces: ${openBraces} opening, ${closeBraces} closing`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Create and render template in one call
 *
 * @param {string} template - Template string
 * @param {Object} data - Data context
 * @param {Object} options - Engine options
 * @returns {string} Rendered HTML
 */
function render(template, data = {}, options = {}) {
  const engine = new TemplateEngine(template, options);
  return engine.render(data);
}

export default TemplateEngine;
export { TemplateEngine, render, DEFAULT_HELPERS };
