/**
 * Tracker Module
 * Product journey and search history tracking
 * PrimeWidgets-style personalization
 *
 * @module core/tracker
 */

import { logger } from './utils.js';
import { storage, STORAGE_KEYS } from './storage.js';

/**
 * ProductTracker Class
 * Tracks user's product viewing journey
 */
class ProductTracker {
  /**
   * @param {StorageManager} storageManager - Storage instance
   * @param {Object} config - Configuration options
   */
  constructor(storageManager, config = {}) {
    this.storage = storageManager;
    this.journeyLimit = config.journeyLimit || 20;
    this.enabled = config.enabled !== false;
  }

  /**
   * Track a product view
   * @param {Object} productData - Product information
   * @param {string} productData.id - Product ID/SKU
   * @param {string} productData.title - Product title
   * @param {number|string} productData.price - Product price
   * @param {string} productData.image - Product image URL
   * @param {string} productData.url - Product page URL
   * @param {string} [productData.brand] - Product brand
   * @param {string} [productData.category] - Product category
   */
  trackProductView(productData) {
    if (!this.enabled || !productData || !productData.id) {
      return;
    }

    try {
      const journey = this.storage.get(STORAGE_KEYS.JOURNEY) || [];
      const productId = String(productData.id);

      // Find existing entry
      const existingIndex = journey.findIndex(p => p.c === productId);

      if (existingIndex !== -1) {
        // Update existing entry
        const existing = journey[existingIndex];
        existing.lv = Date.now();           // last visit
        existing.vc = (existing.vc || 1) + 1; // visit count

        // Update other fields if changed
        if (productData.title) existing.t = productData.title;
        if (productData.price) existing.p = productData.price;
        if (productData.image) existing.i = productData.image;
        if (productData.url) existing.u = productData.url;

        // Move to front
        journey.splice(existingIndex, 1);
        journey.unshift(existing);
      } else {
        // Add new entry
        journey.unshift({
          c: productId,                        // code/id
          t: productData.title || '',          // title
          p: productData.price || 0,           // price
          i: productData.image || '',          // image
          u: productData.url || '',            // url
          b: productData.brand || '',          // brand
          cat: productData.category || '',     // category
          fv: Date.now(),                      // first visit
          lv: Date.now(),                      // last visit
          vc: 1                                // visit count
        });
      }

      // Sort by last visit and limit
      const sorted = journey
        .sort((a, b) => b.lv - a.lv)
        .slice(0, this.journeyLimit);

      this.storage.set(STORAGE_KEYS.JOURNEY, sorted, 30); // 30 gun sakla

      logger.debug(`Product tracked: ${productId}`);
    } catch (e) {
      logger.warn('Product tracking error:', e);
    }
  }

  /**
   * Get recently viewed products
   * @param {number} limit - Maximum number of products
   * @returns {Array} Recently viewed products
   */
  getRecentlyViewed(limit = 10) {
    try {
      const journey = this.storage.get(STORAGE_KEYS.JOURNEY) || [];
      return journey.slice(0, limit).map(p => this._formatProduct(p));
    } catch (e) {
      logger.warn('Get recently viewed error:', e);
      return [];
    }
  }

  /**
   * Get recently viewed products excluding specific product
   * Useful for showing "recently viewed" on product pages
   * @param {string} excludeId - Product ID to exclude
   * @param {number} limit - Maximum number of products
   * @returns {Array} Recently viewed products
   */
  getRecentlyViewedExcept(excludeId, limit = 10) {
    try {
      const journey = this.storage.get(STORAGE_KEYS.JOURNEY) || [];
      const excludeIdStr = String(excludeId);

      return journey
        .filter(p => p.c !== excludeIdStr)
        .slice(0, limit)
        .map(p => this._formatProduct(p));
    } catch (e) {
      logger.warn('Get recently viewed except error:', e);
      return [];
    }
  }

  /**
   * Get products by category from journey
   * @param {string} category - Category to filter by
   * @param {number} limit - Maximum number of products
   * @returns {Array} Products in category
   */
  getByCategory(category, limit = 10) {
    try {
      const journey = this.storage.get(STORAGE_KEYS.JOURNEY) || [];

      return journey
        .filter(p => p.cat === category)
        .slice(0, limit)
        .map(p => this._formatProduct(p));
    } catch (e) {
      logger.warn('Get by category error:', e);
      return [];
    }
  }

  /**
   * Get most viewed products
   * @param {number} limit - Maximum number of products
   * @returns {Array} Most viewed products
   */
  getMostViewed(limit = 10) {
    try {
      const journey = this.storage.get(STORAGE_KEYS.JOURNEY) || [];

      return journey
        .slice() // copy
        .sort((a, b) => (b.vc || 1) - (a.vc || 1))
        .slice(0, limit)
        .map(p => this._formatProduct(p));
    } catch (e) {
      logger.warn('Get most viewed error:', e);
      return [];
    }
  }

  /**
   * Check if product was viewed
   * @param {string} productId - Product ID
   * @returns {boolean}
   */
  hasViewed(productId) {
    try {
      const journey = this.storage.get(STORAGE_KEYS.JOURNEY) || [];
      return journey.some(p => p.c === String(productId));
    } catch (e) {
      return false;
    }
  }

  /**
   * Get view count for a product
   * @param {string} productId - Product ID
   * @returns {number} View count
   */
  getViewCount(productId) {
    try {
      const journey = this.storage.get(STORAGE_KEYS.JOURNEY) || [];
      const product = journey.find(p => p.c === String(productId));
      return product ? (product.vc || 1) : 0;
    } catch (e) {
      return 0;
    }
  }

  /**
   * Remove a product from journey
   * @param {string} productId - Product ID
   */
  removeProduct(productId) {
    try {
      const journey = this.storage.get(STORAGE_KEYS.JOURNEY) || [];
      const filtered = journey.filter(p => p.c !== String(productId));
      this.storage.set(STORAGE_KEYS.JOURNEY, filtered, 30);
    } catch (e) {
      logger.warn('Remove product error:', e);
    }
  }

  /**
   * Clear all journey data
   */
  clearJourney() {
    this.storage.remove(STORAGE_KEYS.JOURNEY);
    logger.debug('Journey cleared');
  }

  /**
   * Get journey statistics
   * @returns {Object} Statistics
   */
  getStats() {
    try {
      const journey = this.storage.get(STORAGE_KEYS.JOURNEY) || [];

      return {
        totalProducts: journey.length,
        totalViews: journey.reduce((sum, p) => sum + (p.vc || 1), 0),
        oldestView: journey.length > 0 ? new Date(Math.min(...journey.map(p => p.fv))) : null,
        newestView: journey.length > 0 ? new Date(Math.max(...journey.map(p => p.lv))) : null
      };
    } catch (e) {
      return { totalProducts: 0, totalViews: 0, oldestView: null, newestView: null };
    }
  }

  /**
   * Format product data for output
   * @private
   * @param {Object} p - Raw product data
   * @returns {Object} Formatted product
   */
  _formatProduct(p) {
    return {
      id: p.c,
      title: p.t,
      price: p.p,
      image: p.i,
      url: p.u,
      brand: p.b,
      category: p.cat,
      firstVisit: p.fv,
      lastVisit: p.lv,
      visitCount: p.vc || 1
    };
  }
}

/**
 * SearchTracker Class
 * Tracks user's search history
 */
class SearchTracker {
  /**
   * @param {StorageManager} storageManager - Storage instance
   * @param {Object} config - Configuration options
   */
  constructor(storageManager, config = {}) {
    this.storage = storageManager;
    this.historyLimit = config.searchHistoryLimit || 10;
    this.minQueryLength = config.minQueryLength || 2;
    this.enabled = config.enabled !== false;
  }

  /**
   * Track a search query
   * @param {string} query - Search query
   */
  trackSearch(query) {
    if (!this.enabled) return;

    // Validate query
    const trimmed = (query || '').trim();
    if (trimmed.length < this.minQueryLength) {
      return;
    }

    try {
      let history = this.storage.get(STORAGE_KEYS.SEARCH_HISTORY) || [];

      // Remove duplicate (case-insensitive)
      history = history.filter(q =>
        q.query.toLowerCase() !== trimmed.toLowerCase()
      );

      // Add to front
      history.unshift({
        query: trimmed,
        timestamp: Date.now()
      });

      // Limit
      history = history.slice(0, this.historyLimit);

      this.storage.set(STORAGE_KEYS.SEARCH_HISTORY, history, 30); // 30 gun sakla

      logger.debug(`Search tracked: ${trimmed}`);
    } catch (e) {
      logger.warn('Search tracking error:', e);
    }
  }

  /**
   * Get search history
   * @param {number} limit - Maximum number of queries
   * @returns {Array<string>} Search queries
   */
  getHistory(limit = 5) {
    try {
      const history = this.storage.get(STORAGE_KEYS.SEARCH_HISTORY) || [];
      return history.slice(0, limit).map(h => h.query || h);
    } catch (e) {
      logger.warn('Get search history error:', e);
      return [];
    }
  }

  /**
   * Get full search history with timestamps
   * @param {number} limit - Maximum number of entries
   * @returns {Array<Object>} Search entries with timestamps
   */
  getFullHistory(limit = 10) {
    try {
      const history = this.storage.get(STORAGE_KEYS.SEARCH_HISTORY) || [];
      return history.slice(0, limit).map(h => ({
        query: h.query || h,
        timestamp: h.timestamp || Date.now()
      }));
    } catch (e) {
      logger.warn('Get full search history error:', e);
      return [];
    }
  }

  /**
   * Remove a query from history
   * @param {string} query - Query to remove
   */
  removeQuery(query) {
    try {
      let history = this.storage.get(STORAGE_KEYS.SEARCH_HISTORY) || [];
      history = history.filter(h =>
        (h.query || h).toLowerCase() !== query.toLowerCase()
      );
      this.storage.set(STORAGE_KEYS.SEARCH_HISTORY, history, 30);
    } catch (e) {
      logger.warn('Remove query error:', e);
    }
  }

  /**
   * Clear all search history
   */
  clearHistory() {
    this.storage.remove(STORAGE_KEYS.SEARCH_HISTORY);
    logger.debug('Search history cleared');
  }

  /**
   * Check if a query exists in history
   * @param {string} query - Query to check
   * @returns {boolean}
   */
  hasSearched(query) {
    try {
      const history = this.storage.get(STORAGE_KEYS.SEARCH_HISTORY) || [];
      return history.some(h =>
        (h.query || h).toLowerCase() === query.toLowerCase()
      );
    } catch (e) {
      return false;
    }
  }
}

/**
 * Unified Tracker Class
 * Combines product and search tracking
 */
class Tracker {
  /**
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = config;
    this.storage = storage;

    this.products = new ProductTracker(this.storage, config);
    this.search = new SearchTracker(this.storage, config);

    this.enabled = config.enabled !== false;
  }

  /**
   * Track product view (shorthand)
   * @param {Object} productData - Product data
   */
  trackProductView(productData) {
    return this.products.trackProductView(productData);
  }

  /**
   * Get recently viewed products (shorthand)
   * @param {number} limit - Limit
   * @returns {Array}
   */
  getRecentlyViewed(limit = 10) {
    return this.products.getRecentlyViewed(limit);
  }

  /**
   * Get recently viewed except (shorthand)
   * @param {string} excludeId - ID to exclude
   * @param {number} limit - Limit
   * @returns {Array}
   */
  getRecentlyViewedExcept(excludeId, limit = 10) {
    return this.products.getRecentlyViewedExcept(excludeId, limit);
  }

  /**
   * Track search (shorthand)
   * @param {string} query - Search query
   */
  trackSearch(query) {
    return this.search.trackSearch(query);
  }

  /**
   * Get search history (shorthand)
   * @param {number} limit - Limit
   * @returns {Array<string>}
   */
  getSearchHistory(limit = 5) {
    return this.search.getHistory(limit);
  }

  /**
   * Clear all tracking data
   */
  clearAll() {
    this.products.clearJourney();
    this.search.clearHistory();
    logger.info('All tracking data cleared');
  }

  /**
   * Get combined statistics
   * @returns {Object}
   */
  getStats() {
    return {
      products: this.products.getStats(),
      searches: {
        totalQueries: this.search.getHistory(100).length
      },
      storage: this.storage.getStats()
    };
  }

  /**
   * Enable/disable tracking
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    this.products.enabled = enabled;
    this.search.enabled = enabled;
  }
}

// Create singleton instance
const tracker = new Tracker();

export {
  ProductTracker,
  SearchTracker,
  Tracker,
  tracker
};

export default tracker;
