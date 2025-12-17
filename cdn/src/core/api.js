/**
 * API Client
 * Backend communication layer for widget data
 *
 * @module core/api
 */

import { logger } from './utils.js';

/**
 * HTTP methods
 * @enum {string}
 */
const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE'
};

/**
 * API Error class
 */
class ApiError extends Error {
  /**
   * @param {string} message - Error message
   * @param {number} status - HTTP status code
   * @param {Object} data - Additional error data
   */
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * API Client for backend communication
 */
class ApiClient {
  /**
   * Create API client instance
   *
   * @param {Object} options - Client options
   * @param {string} options.baseUrl - API base URL
   * @param {string} options.apiKey - Customer API key
   * @param {number} options.timeout - Request timeout in ms
   * @param {number} options.retries - Number of retry attempts
   */
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || '';
    this.apiKey = options.apiKey || '';
    this.timeout = options.timeout || 10000;
    this.retries = options.retries || 2;
    this.cache = new Map();
    this.cacheTimeout = options.cacheTimeout || 60000; // 1 minute default
  }

  /**
   * Configure client
   *
   * @param {Object} options - Configuration options
   */
  configure(options) {
    if (options.baseUrl) this.baseUrl = options.baseUrl;
    if (options.apiKey) this.apiKey = options.apiKey;
    if (options.timeout) this.timeout = options.timeout;
    if (options.retries) this.retries = options.retries;
    if (options.cacheTimeout) this.cacheTimeout = options.cacheTimeout;

    logger.debug('API client configured:', {
      baseUrl: this.baseUrl,
      timeout: this.timeout
    });
  }

  /**
   * Build full URL
   *
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @returns {string} Full URL
   */
  _buildUrl(endpoint, params = {}) {
    let url = `${this.baseUrl}${endpoint}`;

    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    return url;
  }

  /**
   * Build request headers
   *
   * @returns {Object} Headers object
   */
  _buildHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    return headers;
  }

  /**
   * Make HTTP request with retry logic
   *
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async _request(method, endpoint, options = {}) {
    const { params, body, useCache = true, retryCount = 0 } = options;

    const url = this._buildUrl(endpoint, params);

    // Check cache for GET requests
    if (method === HTTP_METHODS.GET && useCache) {
      const cached = this._getFromCache(url);
      if (cached) {
        logger.debug('Cache hit:', endpoint);
        return cached;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      logger.debug(`API ${method}:`, endpoint);

      const fetchOptions = {
        method,
        headers: this._buildHeaders(),
        signal: controller.signal
      };

      if (body && method !== HTTP_METHODS.GET) {
        fetchOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      // Parse response
      const data = await this._parseResponse(response);

      // Handle non-OK responses
      if (!response.ok) {
        throw new ApiError(
          data.message || `HTTP ${response.status}`,
          response.status,
          data
        );
      }

      // Cache successful GET responses
      if (method === HTTP_METHODS.GET && useCache) {
        this._setCache(url, data);
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle abort (timeout)
      if (error.name === 'AbortError') {
        logger.warn('Request timeout:', endpoint);

        if (retryCount < this.retries) {
          logger.debug(`Retrying (${retryCount + 1}/${this.retries}):`, endpoint);
          return this._request(method, endpoint, {
            ...options,
            retryCount: retryCount + 1
          });
        }

        throw new ApiError('Request timeout', 408);
      }

      // Handle network errors with retry
      if (error instanceof TypeError && retryCount < this.retries) {
        logger.debug(`Network error, retrying (${retryCount + 1}/${this.retries}):`, endpoint);
        await this._delay(1000 * (retryCount + 1));
        return this._request(method, endpoint, {
          ...options,
          retryCount: retryCount + 1
        });
      }

      // Re-throw API errors
      if (error instanceof ApiError) {
        throw error;
      }

      logger.error('API request failed:', error.message);
      throw new ApiError(error.message || 'Network error');
    }
  }

  /**
   * Parse response body
   *
   * @param {Response} response - Fetch response
   * @returns {Promise<Object>} Parsed data
   */
  async _parseResponse(response) {
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      try {
        return await response.json();
      } catch (e) {
        logger.warn('Failed to parse JSON response');
        return {};
      }
    }

    return { text: await response.text() };
  }

  /**
   * Get from cache
   *
   * @param {string} key - Cache key
   * @returns {Object|null} Cached data or null
   */
  _getFromCache(key) {
    const entry = this.cache.get(key);

    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cache entry
   *
   * @param {string} key - Cache key
   * @param {Object} data - Data to cache
   */
  _setCache(key, data) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.cacheTimeout
    });

    // Clean old entries periodically
    if (this.cache.size > 100) {
      this._cleanCache();
    }
  }

  /**
   * Clean expired cache entries
   */
  _cleanCache() {
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
    logger.debug('API cache cleared');
  }

  /**
   * Delay helper
   *
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ========================================
  // Public API Methods
  // ========================================

  /**
   * Get widget configuration
   *
   * @param {string} customerSlug - Customer slug
   * @param {string} widgetType - Widget type (optional)
   * @returns {Promise<Object>} Widget configuration
   */
  async getWidgetConfig(customerSlug, widgetType = null) {
    const endpoint = `/api/public/widget/${customerSlug}`;
    const params = widgetType ? { type: widgetType } : {};

    try {
      const response = await this._request(HTTP_METHODS.GET, endpoint, { params });
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch widget config:', error.message);
      throw error;
    }
  }

  /**
   * Get products for widget
   *
   * @param {string} customerSlug - Customer slug
   * @param {Object} options - Query options
   * @param {string} options.campaign - Campaign filter
   * @param {string} options.category - Category filter
   * @param {number} options.limit - Max products
   * @param {number} options.offset - Pagination offset
   * @returns {Promise<Object>} Products data
   */
  async getProducts(customerSlug, options = {}) {
    const endpoint = `/api/public/products/${customerSlug}`;

    try {
      const response = await this._request(HTTP_METHODS.GET, endpoint, {
        params: options
      });
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch products:', error.message);
      throw error;
    }
  }

  /**
   * Get theme configuration
   *
   * @param {string} customerSlug - Customer slug
   * @returns {Promise<Object>} Theme data
   */
  async getTheme(customerSlug) {
    const endpoint = `/api/public/theme/${customerSlug}`;

    try {
      const response = await this._request(HTTP_METHODS.GET, endpoint);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch theme:', error.message);
      throw error;
    }
  }

  /**
   * Get full widget data (config + theme + products)
   *
   * @param {string} customerSlug - Customer slug
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Combined widget data
   */
  async getWidgetData(customerSlug, options = {}) {
    try {
      // Fetch config, theme, and products in parallel
      const [config, theme, productsData] = await Promise.all([
        this.getWidgetConfig(customerSlug, options.widgetType),
        this.getTheme(customerSlug).catch(() => ({})), // Theme is optional
        this.getProducts(customerSlug, {
          campaign: options.campaign,
          category: options.category,
          limit: options.limit || 20
        })
      ]);

      return {
        config,
        theme,
        products: productsData.products || [],
        total: productsData.total || 0,
        customer: productsData.customer || customerSlug
      };
    } catch (error) {
      logger.error('Failed to fetch widget data:', error.message);
      throw error;
    }
  }

  /**
   * Track widget event (analytics)
   *
   * @param {string} customerSlug - Customer slug
   * @param {Object} event - Event data
   * @param {string} event.type - Event type (view, click, impression)
   * @param {string} event.widgetId - Widget ID
   * @param {string} event.productId - Product ID (optional)
   * @returns {Promise<void>}
   */
  async trackEvent(customerSlug, event) {
    const endpoint = `/api/public/track/${customerSlug}`;

    try {
      await this._request(HTTP_METHODS.POST, endpoint, {
        body: {
          ...event,
          timestamp: Date.now(),
          url: window.location.href,
          referrer: document.referrer
        },
        useCache: false
      });
    } catch (error) {
      // Don't throw for analytics failures
      logger.debug('Event tracking failed:', error.message);
    }
  }

  /**
   * Health check
   *
   * @returns {Promise<boolean>} True if API is healthy
   */
  async healthCheck() {
    try {
      const endpoint = '/api/health';
      const response = await this._request(HTTP_METHODS.GET, endpoint, {
        useCache: false,
        timeout: 5000
      });
      return response.status === 'ok';
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
const api = new ApiClient();

export { ApiClient, ApiError, api };
