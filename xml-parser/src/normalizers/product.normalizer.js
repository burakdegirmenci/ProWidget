/**
 * Product Normalizer
 * Normalizes parsed product data to consistent format
 *
 * @module normalizers/product
 */

const logger = require('../utils/logger');

/**
 * Normalize products to standard format
 */
class ProductNormalizer {
  /**
   * Normalize array of products
   *
   * @param {Array} products - Raw products from parser
   * @returns {Array} Normalized products
   */
  normalize(products) {
    if (!Array.isArray(products)) {
      logger.warn('Products is not an array, returning empty array');
      return [];
    }

    const normalized = products
      .map((product, index) => this.normalizeProduct(product, index))
      .filter((product) => this.isValidProduct(product));

    logger.info(`Normalized ${normalized.length} of ${products.length} products`);
    return normalized;
  }

  /**
   * Normalize single product
   *
   * @param {Object} product - Raw product
   * @param {number} index - Product index (for fallback ID)
   * @returns {Object} Normalized product
   */
  normalizeProduct(product, index) {
    return {
      id: this.normalizeId(product.externalId, index),
      title: this.normalizeText(product.title, 500),
      description: this.normalizeText(product.description, 5000),
      price: this.normalizePrice(product.price),
      salePrice: this.normalizePrice(product.salePrice),
      currency: this.normalizeCurrency(product.currency),
      image: this.normalizeUrl(product.imageUrl),
      url: this.normalizeUrl(product.productUrl),
      category: this.normalizeText(product.category, 255),
      brand: this.normalizeText(product.brand, 255),
      stock: this.normalizeStockStatus(product.stockStatus),
      attributes: this.normalizeAttributes(product.attributes)
    };
  }

  /**
   * Normalize product ID
   *
   * @param {*} id - Raw ID
   * @param {number} index - Fallback index
   * @returns {string} Normalized ID
   */
  normalizeId(id, index) {
    if (id === null || id === undefined || id === '') {
      return `product-${index}`;
    }
    return String(id).trim().slice(0, 255);
  }

  /**
   * Normalize text field
   *
   * @param {*} text - Raw text
   * @param {number} maxLength - Maximum length
   * @returns {string} Normalized text
   */
  normalizeText(text, maxLength = 255) {
    if (!text) return '';

    return String(text)
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, maxLength);
  }

  /**
   * Normalize price
   *
   * @param {*} price - Raw price
   * @returns {number|null} Normalized price
   */
  normalizePrice(price) {
    if (price === null || price === undefined) {
      return null;
    }

    const numPrice = parseFloat(price);

    if (isNaN(numPrice) || numPrice < 0) {
      return null;
    }

    // Round to 2 decimal places
    return Math.round(numPrice * 100) / 100;
  }

  /**
   * Normalize currency code
   *
   * @param {string} currency - Raw currency
   * @returns {string} Normalized currency code
   */
  normalizeCurrency(currency) {
    if (!currency) return 'TRY';

    const upper = String(currency).toUpperCase().trim();

    // Map common variations
    const currencyMap = {
      'TL': 'TRY',
      'TURK LIRASI': 'TRY',
      'TURKISH LIRA': 'TRY',
      'EURO': 'EUR',
      'DOLLAR': 'USD',
      'DOLAR': 'USD'
    };

    return currencyMap[upper] || upper.slice(0, 3);
  }

  /**
   * Normalize URL
   *
   * @param {string} url - Raw URL
   * @returns {string} Normalized URL
   */
  normalizeUrl(url) {
    if (!url) return '';

    let normalized = String(url).trim();

    // Remove whitespace and newlines
    normalized = normalized.replace(/\s+/g, '');

    // Add https if protocol is missing
    if (normalized && !normalized.startsWith('http') && !normalized.startsWith('//')) {
      if (normalized.startsWith('/')) {
        // Relative URL - keep as is
        return normalized;
      }
      normalized = 'https://' + normalized;
    }

    // Ensure https for // URLs
    if (normalized.startsWith('//')) {
      normalized = 'https:' + normalized;
    }

    return normalized;
  }

  /**
   * Normalize stock status
   *
   * @param {string} status - Raw status
   * @returns {string} Normalized status
   */
  normalizeStockStatus(status) {
    if (!status) return 'in_stock';

    const lower = String(status).toLowerCase();

    if (lower.includes('out') || lower.includes('yok') || lower === '0') {
      return 'out_of_stock';
    }

    if (lower.includes('preorder') || lower.includes('backorder')) {
      return 'preorder';
    }

    return 'in_stock';
  }

  /**
   * Normalize attributes object
   *
   * @param {Object} attributes - Raw attributes
   * @returns {Object} Normalized attributes
   */
  normalizeAttributes(attributes) {
    if (!attributes || typeof attributes !== 'object') {
      return {};
    }

    const normalized = {};

    for (const [key, value] of Object.entries(attributes)) {
      // Skip null/undefined values
      if (value === null || value === undefined) continue;

      // Normalize key
      const normalizedKey = key
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .slice(0, 50);

      // Normalize value
      if (typeof value === 'object') {
        normalized[normalizedKey] = JSON.stringify(value);
      } else {
        normalized[normalizedKey] = String(value).slice(0, 500);
      }
    }

    return normalized;
  }

  /**
   * Check if product is valid
   *
   * @param {Object} product - Normalized product
   * @returns {boolean} True if valid
   */
  isValidProduct(product) {
    // Must have ID and title
    if (!product.id || !product.title) {
      return false;
    }

    // Must have price greater than 0
    if (product.price === null || product.price <= 0) {
      return false;
    }

    return true;
  }

  /**
   * Deduplicate products by ID
   *
   * @param {Array} products - Products array
   * @returns {Array} Deduplicated products
   */
  deduplicate(products) {
    const seen = new Map();

    for (const product of products) {
      // Keep the first occurrence or the one with more data
      if (!seen.has(product.id)) {
        seen.set(product.id, product);
      } else {
        const existing = seen.get(product.id);
        if (this.getProductCompleteness(product) > this.getProductCompleteness(existing)) {
          seen.set(product.id, product);
        }
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Calculate product data completeness score
   *
   * @param {Object} product - Product object
   * @returns {number} Completeness score
   */
  getProductCompleteness(product) {
    let score = 0;

    if (product.title) score += 2;
    if (product.description) score += 1;
    if (product.price > 0) score += 2;
    if (product.image) score += 2;
    if (product.url) score += 1;
    if (product.category) score += 1;
    if (product.brand) score += 1;

    return score;
  }
}

module.exports = new ProductNormalizer();
