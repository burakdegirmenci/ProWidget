/**
 * Google Merchant Feed Parser
 * Parses Google Shopping XML feed format
 *
 * @module parsers/google
 */

const BaseParser = require('./base.parser');
const config = require('../config');

/**
 * Parser for Google Merchant Center feed format
 * Supports both RSS 2.0 and Atom formats
 */
class GoogleParser extends BaseParser {
  constructor() {
    super({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      // Handle namespaces
      removeNSPrefix: false
    });

    this.fieldMapping = config.fieldMappings.google;
  }

  /**
   * Get field mapping for Google format
   * @returns {Object} Field mapping
   */
  getFieldMapping() {
    return this.fieldMapping;
  }

  /**
   * Get products path in Google feed
   * @returns {string} Path to products
   */
  getProductsPath() {
    return 'rss.channel.item';
  }

  /**
   * Extract products from parsed Google feed
   *
   * @param {Object} parsedXml - Parsed XML object
   * @returns {Array} Array of raw product objects
   */
  extractProducts(parsedXml) {
    // Try different possible structures
    let items = [];

    // RSS 2.0 format: rss > channel > item
    if (parsedXml.rss?.channel?.item) {
      items = this.ensureArray(parsedXml.rss.channel.item);
    }
    // Atom format: feed > entry
    else if (parsedXml.feed?.entry) {
      items = this.ensureArray(parsedXml.feed.entry);
    }
    // Direct channel: channel > item
    else if (parsedXml.channel?.item) {
      items = this.ensureArray(parsedXml.channel.item);
    }

    return items.map((item) => this.mapProduct(item));
  }

  /**
   * Map raw item to product structure
   *
   * @param {Object} item - Raw feed item
   * @returns {Object} Mapped product
   */
  mapProduct(item) {
    // Get price info
    const priceStr = this.getValue(item, this.fieldMapping.price);
    const salePriceStr = this.getValue(item, this.fieldMapping.salePrice);
    const { price, currency } = this.parsePrice(priceStr);
    const { price: salePrice } = this.parsePrice(salePriceStr);

    // Get availability
    const availabilityStr = this.getValue(item, this.fieldMapping.availability);
    const stockStatus = this.parseAvailability(availabilityStr);

    // Build product object
    return {
      externalId: String(this.getValue(item, this.fieldMapping.id, '')),
      title: this.getValue(item, this.fieldMapping.title, ''),
      description: this.cleanDescription(
        this.getValue(item, this.fieldMapping.description, '')
      ),
      price,
      salePrice: salePrice > 0 && salePrice < price ? salePrice : null,
      currency,
      imageUrl: this.getValue(item, this.fieldMapping.imageUrl, ''),
      productUrl: this.getValue(item, this.fieldMapping.productUrl, ''),
      category: this.getValue(item, this.fieldMapping.category, ''),
      brand: this.getValue(item, this.fieldMapping.brand, ''),
      stockStatus,
      attributes: this.extractAttributes(item)
    };
  }

  /**
   * Extract additional attributes from item
   *
   * @param {Object} item - Raw feed item
   * @returns {Object} Additional attributes
   */
  extractAttributes(item) {
    const attributes = {};

    // Common Google Merchant attributes
    const attrFields = [
      { key: 'gtin', paths: ['g:gtin', 'gtin'] },
      { key: 'mpn', paths: ['g:mpn', 'mpn'] },
      { key: 'condition', paths: ['g:condition', 'condition'] },
      { key: 'color', paths: ['g:color', 'color'] },
      { key: 'size', paths: ['g:size', 'size'] },
      { key: 'material', paths: ['g:material', 'material'] },
      { key: 'gender', paths: ['g:gender', 'gender'] },
      { key: 'ageGroup', paths: ['g:age_group', 'age_group'] },
      { key: 'shipping', paths: ['g:shipping', 'shipping'] },
      { key: 'customLabel0', paths: ['g:custom_label_0', 'custom_label_0'] },
      { key: 'customLabel1', paths: ['g:custom_label_1', 'custom_label_1'] }
    ];

    for (const attr of attrFields) {
      const value = this.getValue(item, attr.paths);
      if (value) {
        attributes[attr.key] = value;
      }
    }

    return attributes;
  }

  /**
   * Clean HTML and extra whitespace from description
   *
   * @param {string} description - Raw description
   * @returns {string} Cleaned description
   */
  cleanDescription(description) {
    if (!description) return '';

    return description
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp;
      .replace(/&amp;/g, '&') // Replace &amp;
      .replace(/&lt;/g, '<') // Replace &lt;
      .replace(/&gt;/g, '>') // Replace &gt;
      .replace(/&quot;/g, '"') // Replace &quot;
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Extract campaigns from feed (if present)
   *
   * @param {Object} parsedXml - Parsed XML object
   * @returns {Array} Array of campaigns
   */
  extractCampaigns(parsedXml) {
    // Google feeds typically don't have campaigns
    // But we can extract them from custom labels if present
    const campaigns = [];
    const seenCampaigns = new Set();

    // Try to extract campaigns from products' custom labels
    let items = [];
    if (parsedXml.rss?.channel?.item) {
      items = this.ensureArray(parsedXml.rss.channel.item);
    }

    for (const item of items) {
      const customLabel = this.getValue(item, ['g:custom_label_0', 'custom_label_0']);
      if (customLabel && customLabel.toLowerCase().includes('campaign')) {
        const campaignId = customLabel.replace(/\s+/g, '-').toLowerCase();
        if (!seenCampaigns.has(campaignId)) {
          seenCampaigns.add(campaignId);
          campaigns.push({
            id: campaignId,
            title: customLabel,
            start: null,
            end: null
          });
        }
      }
    }

    return campaigns;
  }
}

module.exports = GoogleParser;
