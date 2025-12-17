/**
 * Generic XML Feed Parser
 * Flexible parser that handles various XML feed formats
 *
 * @module parsers/generic
 */

const BaseParser = require('./base.parser');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Generic parser for custom XML feed formats
 * Automatically detects structure and maps fields
 */
class GenericParser extends BaseParser {
  constructor(format = 'custom') {
    super({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      removeNSPrefix: true // Remove namespace prefixes for easier parsing
    });

    this.format = format;
    this.fieldMapping = config.fieldMappings[format] || config.fieldMappings.custom;
  }

  /**
   * Get field mapping
   * @returns {Object} Field mapping
   */
  getFieldMapping() {
    return this.fieldMapping;
  }

  /**
   * Detect and get products path
   * @returns {string} Path to products
   */
  getProductsPath() {
    return 'auto-detect';
  }

  /**
   * Extract products from parsed XML
   * Automatically detects the product container
   *
   * @param {Object} parsedXml - Parsed XML object
   * @returns {Array} Array of product objects
   */
  extractProducts(parsedXml) {
    // Try to find the products array in common locations
    const possiblePaths = [
      // RSS formats
      { path: ['rss', 'channel', 'item'], name: 'RSS' },
      { path: ['feed', 'entry'], name: 'Atom' },
      { path: ['channel', 'item'], name: 'Channel' },

      // Common custom formats
      { path: ['products', 'product'], name: 'Products' },
      { path: ['items', 'item'], name: 'Items' },
      { path: ['catalog', 'product'], name: 'Catalog' },
      { path: ['data', 'product'], name: 'Data' },
      { path: ['root', 'product'], name: 'Root' },

      // Turkish e-commerce common formats
      { path: ['urunler', 'urun'], name: 'Urunler' },
      { path: ['xml', 'urun'], name: 'XML Urun' },
      { path: ['xml', 'product'], name: 'XML Product' }
    ];

    for (const { path, name } of possiblePaths) {
      const items = this.getNestedValue(parsedXml, path);
      if (items) {
        const itemArray = this.ensureArray(items);
        if (itemArray.length > 0) {
          logger.info(`Detected feed format: ${name} with ${itemArray.length} items`);
          return itemArray.map((item) => this.mapProduct(item));
        }
      }
    }

    // If no known structure found, try to find any array of objects
    const detectedItems = this.detectProductArray(parsedXml);
    if (detectedItems.length > 0) {
      logger.info(`Auto-detected ${detectedItems.length} items`);
      return detectedItems.map((item) => this.mapProduct(item));
    }

    logger.warn('Could not detect product structure in feed');
    return [];
  }

  /**
   * Get nested value from object using path array
   *
   * @param {Object} obj - Source object
   * @param {string[]} path - Path array
   * @returns {*} Found value or undefined
   */
  getNestedValue(obj, path) {
    let current = obj;

    for (const key of path) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[key];
    }

    return current;
  }

  /**
   * Detect product array in unknown structure
   *
   * @param {Object} obj - Parsed XML object
   * @param {number} depth - Current recursion depth
   * @returns {Array} Detected product array
   */
  detectProductArray(obj, depth = 0) {
    if (depth > 5 || !obj || typeof obj !== 'object') {
      return [];
    }

    // Look for arrays
    if (Array.isArray(obj) && obj.length > 0) {
      // Check if array items look like products
      const first = obj[0];
      if (this.looksLikeProduct(first)) {
        return obj;
      }
    }

    // Recurse into object properties
    for (const key of Object.keys(obj)) {
      const value = obj[key];

      if (Array.isArray(value) && value.length > 0) {
        if (this.looksLikeProduct(value[0])) {
          return value;
        }
      }

      if (typeof value === 'object' && value !== null) {
        const result = this.detectProductArray(value, depth + 1);
        if (result.length > 0) {
          return result;
        }
      }
    }

    return [];
  }

  /**
   * Check if object looks like a product
   *
   * @param {Object} obj - Object to check
   * @returns {boolean} True if it looks like a product
   */
  looksLikeProduct(obj) {
    if (!obj || typeof obj !== 'object') {
      return false;
    }

    const keys = Object.keys(obj).map((k) => k.toLowerCase());

    // Must have at least some product-like fields
    const productFields = [
      'id', 'sku', 'code', 'product_id',
      'title', 'name', 'product_name',
      'price', 'fiyat',
      'image', 'img', 'resim',
      'url', 'link'
    ];

    const matchCount = productFields.filter((field) =>
      keys.some((k) => k.includes(field))
    ).length;

    return matchCount >= 2;
  }

  /**
   * Map raw item to product structure
   *
   * @param {Object} item - Raw feed item
   * @returns {Object} Mapped product
   */
  mapProduct(item) {
    // Flatten the item if needed
    const flatItem = this.flattenObject(item);

    // Find values using multiple possible field names
    const id = this.findValue(flatItem, this.fieldMapping.id) || this.generateId(flatItem);
    const title = this.findValue(flatItem, this.fieldMapping.title) || '';
    const description = this.cleanText(this.findValue(flatItem, this.fieldMapping.description) || '');

    // Parse prices
    const priceValue = this.findValue(flatItem, this.fieldMapping.price);
    const salePriceValue = this.findValue(flatItem, this.fieldMapping.salePrice);
    const { price, currency } = this.parsePrice(priceValue);
    const { price: salePrice } = this.parsePrice(salePriceValue);

    // Get other fields
    const imageUrl = this.findValue(flatItem, this.fieldMapping.imageUrl) || '';
    const productUrl = this.findValue(flatItem, this.fieldMapping.productUrl) || '';
    const category = this.findValue(flatItem, this.fieldMapping.category) || '';
    const brand = this.findValue(flatItem, this.fieldMapping.brand) || '';

    // Parse availability
    const availabilityStr = this.findValue(flatItem, this.fieldMapping.availability);
    const stockStatus = this.parseAvailability(availabilityStr);

    return {
      externalId: String(id),
      title: this.cleanText(title),
      description,
      price,
      salePrice: salePrice > 0 && salePrice < price ? salePrice : null,
      currency,
      imageUrl: this.cleanUrl(imageUrl),
      productUrl: this.cleanUrl(productUrl),
      category: this.cleanText(category),
      brand: this.cleanText(brand),
      stockStatus,
      attributes: this.extractRemainingAttributes(flatItem)
    };
  }

  /**
   * Find value in object using multiple possible keys
   *
   * @param {Object} obj - Source object
   * @param {string[]} possibleKeys - Possible key names
   * @returns {*} Found value or undefined
   */
  findValue(obj, possibleKeys) {
    if (!Array.isArray(possibleKeys)) {
      possibleKeys = [possibleKeys];
    }

    const objKeys = Object.keys(obj);

    for (const key of possibleKeys) {
      // Exact match
      if (obj[key] !== undefined) {
        return this.extractValue(obj[key]);
      }

      // Case-insensitive match
      const lowerKey = key.toLowerCase();
      const match = objKeys.find((k) => k.toLowerCase() === lowerKey);
      if (match && obj[match] !== undefined) {
        return this.extractValue(obj[match]);
      }

      // Partial match
      const partialMatch = objKeys.find((k) =>
        k.toLowerCase().includes(lowerKey) || lowerKey.includes(k.toLowerCase())
      );
      if (partialMatch && obj[partialMatch] !== undefined) {
        return this.extractValue(obj[partialMatch]);
      }
    }

    return undefined;
  }

  /**
   * Extract primitive value from potentially nested object
   *
   * @param {*} value - Value to extract
   * @returns {*} Extracted value
   */
  extractValue(value) {
    if (value === null || value === undefined) {
      return undefined;
    }

    if (typeof value === 'object') {
      // Handle text node
      if (value['#text'] !== undefined) {
        return value['#text'];
      }
      if (value['_'] !== undefined) {
        return value['_'];
      }
      // Try to get first string value
      const values = Object.values(value);
      for (const v of values) {
        if (typeof v === 'string' || typeof v === 'number') {
          return v;
        }
      }
    }

    return value;
  }

  /**
   * Flatten nested object
   *
   * @param {Object} obj - Object to flatten
   * @param {string} prefix - Key prefix
   * @returns {Object} Flattened object
   */
  flattenObject(obj, prefix = '') {
    const result = {};

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}_${key}` : key;

      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        // Check if it's a text node wrapper
        if (value['#text'] !== undefined) {
          result[newKey] = value['#text'];
        } else {
          Object.assign(result, this.flattenObject(value, newKey));
        }
      } else {
        result[newKey] = value;
      }
    }

    // Also keep original structure
    Object.assign(result, obj);

    return result;
  }

  /**
   * Generate ID from product data
   *
   * @param {Object} item - Product item
   * @returns {string} Generated ID
   */
  generateId(item) {
    const title = this.findValue(item, ['title', 'name']) || '';
    const url = this.findValue(item, ['url', 'link']) || '';

    // Create hash from title and url
    const str = `${title}-${url}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `gen-${Math.abs(hash)}`;
  }

  /**
   * Clean text value
   *
   * @param {string} text - Text to clean
   * @returns {string} Cleaned text
   */
  cleanText(text) {
    if (!text || typeof text !== 'string') return '';

    return text
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Clean and validate URL
   *
   * @param {string} url - URL to clean
   * @returns {string} Cleaned URL
   */
  cleanUrl(url) {
    if (!url || typeof url !== 'string') return '';

    url = url.trim();

    // Add protocol if missing
    if (url && !url.startsWith('http')) {
      if (url.startsWith('//')) {
        url = 'https:' + url;
      } else if (url.startsWith('/')) {
        // Relative URL, can't fix without base URL
        return url;
      }
    }

    return url;
  }

  /**
   * Extract remaining attributes not mapped to standard fields
   *
   * @param {Object} item - Flattened item
   * @returns {Object} Remaining attributes
   */
  extractRemainingAttributes(item) {
    const usedKeys = new Set();

    // Collect all keys used in field mappings
    for (const keys of Object.values(this.fieldMapping)) {
      if (Array.isArray(keys)) {
        keys.forEach((k) => usedKeys.add(k.toLowerCase()));
      } else {
        usedKeys.add(keys.toLowerCase());
      }
    }

    const attributes = {};

    for (const [key, value] of Object.entries(item)) {
      if (!usedKeys.has(key.toLowerCase()) && this.isUsefulAttribute(key, value)) {
        attributes[key] = typeof value === 'object' ? JSON.stringify(value) : value;
      }
    }

    return attributes;
  }

  /**
   * Check if attribute is useful to keep
   *
   * @param {string} key - Attribute key
   * @param {*} value - Attribute value
   * @returns {boolean} True if useful
   */
  isUsefulAttribute(key, value) {
    // Skip empty values
    if (value === null || value === undefined || value === '') {
      return false;
    }

    // Skip internal/metadata keys
    const skipKeys = ['@_', '#text', '_', 'xmlns'];
    if (skipKeys.some((sk) => key.startsWith(sk))) {
      return false;
    }

    return true;
  }

  /**
   * Extract campaigns (generic implementation)
   *
   * @param {Object} parsedXml - Parsed XML
   * @returns {Array} Campaigns
   */
  extractCampaigns(parsedXml) {
    // Try to find campaigns in common locations
    const possiblePaths = [
      ['campaigns', 'campaign'],
      ['promotions', 'promotion'],
      ['kampanyalar', 'kampanya']
    ];

    for (const path of possiblePaths) {
      const items = this.getNestedValue(parsedXml, path);
      if (items) {
        const itemArray = this.ensureArray(items);
        return itemArray.map((item) => this.mapCampaign(item));
      }
    }

    return [];
  }

  /**
   * Map campaign item
   *
   * @param {Object} item - Raw campaign item
   * @returns {Object} Mapped campaign
   */
  mapCampaign(item) {
    const flatItem = this.flattenObject(item);

    return {
      id: this.findValue(flatItem, ['id', 'campaign_id', 'code']) || '',
      title: this.findValue(flatItem, ['title', 'name', 'description']) || '',
      start: this.findValue(flatItem, ['start', 'start_date', 'baslangic']) || null,
      end: this.findValue(flatItem, ['end', 'end_date', 'bitis']) || null
    };
  }
}

module.exports = GenericParser;
