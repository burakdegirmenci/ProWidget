/**
 * Fetcher Service
 * Handles fetching XML feeds from URLs
 *
 * @module services/fetcher
 */

const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Service for fetching XML feeds from remote URLs
 */
class FetcherService {
  constructor() {
    this.client = axios.create({
      timeout: config.http.timeoutMs,
      maxRedirects: config.http.maxRedirects,
      headers: {
        'User-Agent': config.http.userAgent,
        'Accept': 'application/xml, text/xml, */*',
        'Accept-Encoding': 'gzip, deflate'
      },
      // Response as text for XML parsing
      responseType: 'text',
      // Decompress responses
      decompress: true
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`Fetching: ${config.url}`);
        config.metadata = { startTime: Date.now() };
        return config;
      },
      (error) => {
        logger.fetchError(error.config?.url, error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        const duration = Date.now() - response.config.metadata.startTime;
        logger.debug(`Fetched ${response.config.url} in ${duration}ms`);
        return response;
      },
      (error) => {
        logger.fetchError(error.config?.url, error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Fetch XML from URL
   *
   * @param {string} url - Feed URL
   * @param {Object} options - Fetch options
   * @returns {Promise<string>} XML content
   */
  async fetch(url, options = {}) {
    const { retryCount = config.sync.retryCount, retryDelay = config.sync.retryDelayMs } = options;

    let lastError;

    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        const response = await this.client.get(url);

        // Validate response
        if (!response.data) {
          throw new Error('Empty response received');
        }

        // Check if response looks like XML
        const content = response.data.trim();
        if (!content.startsWith('<?xml') && !content.startsWith('<')) {
          throw new Error('Response does not appear to be XML');
        }

        return content;
      } catch (error) {
        lastError = this.normalizeError(error);

        if (attempt < retryCount) {
          logger.warn(`Fetch attempt ${attempt} failed, retrying in ${retryDelay}ms...`, {
            url,
            error: lastError.message
          });
          await this.sleep(retryDelay * attempt); // Exponential backoff
        }
      }
    }

    throw lastError;
  }

  /**
   * Fetch with validation
   *
   * @param {string} url - Feed URL
   * @returns {Promise<Object>} Fetch result with metadata
   */
  async fetchWithMetadata(url) {
    const startTime = Date.now();

    try {
      const content = await this.fetch(url);
      const duration = Date.now() - startTime;

      return {
        success: true,
        content,
        metadata: {
          url,
          fetchedAt: new Date().toISOString(),
          durationMs: duration,
          contentLength: content.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        metadata: {
          url,
          fetchedAt: new Date().toISOString(),
          durationMs: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Validate URL format
   *
   * @param {string} url - URL to validate
   * @returns {boolean} True if valid
   */
  isValidUrl(url) {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Normalize error for consistent handling
   *
   * @param {Error} error - Raw error
   * @returns {Error} Normalized error
   */
  normalizeError(error) {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const statusText = error.response.statusText;
      return new Error(`HTTP ${status}: ${statusText}`);
    } else if (error.request) {
      // Request made but no response
      if (error.code === 'ECONNREFUSED') {
        return new Error('Connection refused');
      }
      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        return new Error('Request timeout');
      }
      if (error.code === 'ENOTFOUND') {
        return new Error('Host not found');
      }
      return new Error(`Network error: ${error.code || 'Unknown'}`);
    }
    return error;
  }

  /**
   * Sleep helper
   *
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = new FetcherService();
