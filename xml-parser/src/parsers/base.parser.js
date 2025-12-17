/**
 * Base Parser
 * Abstract base class for XML feed parsers
 *
 * @module parsers/base
 */

const { XMLParser } = require('fast-xml-parser');
const logger = require('../utils/logger');

/**
 * Base parser class that all format-specific parsers should extend
 * Implements the Template Method pattern
 */
class BaseParser {
  /**
   * Create a base parser
   * @param {Object} options - Parser options
   */
  constructor(options = {}) {
    this.options = {
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: true,
      trimValues: true,
      ...options
    };

    this.xmlParser = new XMLParser(this.options);
  }

  /**
   * Parse XML string to JavaScript object
   *
   * @param {string} xmlString - Raw XML string
   * @returns {Object} Parsed XML object
   * @throws {Error} If parsing fails
   */
  parseXml(xmlString) {
    try {
      return this.xmlParser.parse(xmlString);
    } catch (error) {
      logger.error('XML parsing failed', { error: error.message });
      throw new Error(`XML parsing failed: ${error.message}`);
    }
  }

  /**
   * Extract products from parsed XML
   * Must be implemented by subclasses
   *
   * @param {Object} parsedXml - Parsed XML object
   * @returns {Array} Array of raw product objects
   */
  extractProducts(parsedXml) {
    throw new Error('extractProducts must be implemented by subclass');
  }

  /**
   * Extract campaigns from parsed XML (optional)
   *
   * @param {Object} parsedXml - Parsed XML object
   * @returns {Array} Array of raw campaign objects
   */
  extractCampaigns(parsedXml) {
    // Default implementation returns empty array
    // Subclasses can override if feed contains campaigns
    return [];
  }

  /**
   * Get the root element path for products
   * Must be implemented by subclasses
   *
   * @returns {string} Path to products in XML structure
   */
  getProductsPath() {
    throw new Error('getProductsPath must be implemented by subclass');
  }

  /**
   * Get field mapping for this parser
   * Must be implemented by subclasses
   *
   * @returns {Object} Field mapping object
   */
  getFieldMapping() {
    throw new Error('getFieldMapping must be implemented by subclass');
  }

  /**
   * Safely get nested value from object using dot notation or array of keys
   *
   * @param {Object} obj - Source object
   * @param {string|string[]} path - Path to value
   * @param {*} defaultValue - Default value if not found
   * @returns {*} Found value or default
   */
  getValue(obj, path, defaultValue = null) {
    if (!obj) return defaultValue;

    // Handle array of possible paths
    if (Array.isArray(path)) {
      for (const p of path) {
        const value = this.getValue(obj, p, undefined);
        if (value !== undefined) return value;
      }
      return defaultValue;
    }

    // Handle dot notation
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined) {
        return defaultValue;
      }

      // Handle namespace prefixes (e.g., g:title)
      if (current[key] !== undefined) {
        current = current[key];
      } else if (current[key.replace(':', '_')] !== undefined) {
        current = current[key.replace(':', '_')];
      } else {
        return defaultValue;
      }
    }

    // Handle text nodes
    if (typeof current === 'object' && current !== null) {
      if (current['#text'] !== undefined) {
        return current['#text'];
      }
      if (current['_'] !== undefined) {
        return current['_'];
      }
    }

    return current ?? defaultValue;
  }

  /**
   * Parse price string to number
   *
   * @param {string|number} priceStr - Price string (e.g., "1899.90 TRY")
   * @returns {Object} Object with price and currency
   */
  parsePrice(priceStr) {
    if (typeof priceStr === 'number') {
      return { price: priceStr, currency: 'TRY' };
    }

    if (!priceStr || typeof priceStr !== 'string') {
      return { price: 0, currency: 'TRY' };
    }

    // Extract number from string
    const priceMatch = priceStr.match(/[\d.,]+/);
    const currencyMatch = priceStr.match(/[A-Z]{3}/);

    let price = 0;
    if (priceMatch) {
      // Handle both comma and dot as decimal separator
      let priceNum = priceMatch[0].replace(/,/g, '.');
      // If there are multiple dots, remove all but the last
      const parts = priceNum.split('.');
      if (parts.length > 2) {
        priceNum = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1];
      }
      price = parseFloat(priceNum) || 0;
    }

    const currency = currencyMatch ? currencyMatch[0] : 'TRY';

    return { price, currency };
  }

  /**
   * Parse availability string to stock status
   *
   * @param {string} availability - Availability string
   * @returns {string} Normalized stock status
   */
  parseAvailability(availability) {
    if (!availability) return 'in_stock';

    const lower = availability.toLowerCase();

    if (lower.includes('out') || lower.includes('yok') || lower === '0' || lower === 'false') {
      return 'out_of_stock';
    }

    if (lower.includes('preorder') || lower.includes('backorder')) {
      return 'preorder';
    }

    return 'in_stock';
  }

  /**
   * Ensure value is an array
   *
   * @param {*} value - Value to convert
   * @returns {Array} Array
   */
  ensureArray(value) {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }

  /**
   * Main parse method - orchestrates the parsing process
   *
   * @param {string} xmlString - Raw XML string
   * @returns {Object} Parsed and structured feed data
   */
  parse(xmlString) {
    const startTime = Date.now();

    // Parse XML
    const parsedXml = this.parseXml(xmlString);

    // Extract products and campaigns
    const rawProducts = this.extractProducts(parsedXml);
    const rawCampaigns = this.extractCampaigns(parsedXml);

    logger.info(`Parsed ${rawProducts.length} products in ${Date.now() - startTime}ms`);

    return {
      products: rawProducts,
      campaigns: rawCampaigns,
      metadata: {
        parsedAt: new Date().toISOString(),
        productCount: rawProducts.length,
        campaignCount: rawCampaigns.length,
        parseTimeMs: Date.now() - startTime
      }
    };
  }
}

module.exports = BaseParser;
