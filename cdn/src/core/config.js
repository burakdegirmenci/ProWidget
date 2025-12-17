/**
 * Configuration Manager
 * Runtime configuration for widget framework
 *
 * @module core/config
 */

import { logger, deepMerge, parseDataAttributes } from './utils.js';

/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
  // API Configuration
  api: {
    baseUrl: '',
    timeout: 10000,
    retries: 2,
    cacheTimeout: 60000
  },

  // Customer Configuration
  customer: {
    slug: '',
    apiKey: ''
  },

  // Widget Defaults
  widgets: {
    autoInit: true,
    autoRender: true,  // Auto-render widgets from API config
    autoRenderTarget: '#pwx-widgets', // Default target for auto-rendered widgets
    lazyLoad: true,
    observerThreshold: 0.1,
    containerSelector: '[data-pwx-widget]'
  },

  // Theme Defaults
  theme: {
    primaryColor: '#007bff',
    secondaryColor: '#6c757d',
    fontFamily: 'inherit',
    borderRadius: '8px',
    shadow: '0 2px 8px rgba(0,0,0,0.1)'
  },

  // Debug Configuration
  debug: {
    enabled: false,
    logLevel: 'WARN'
  },

  // Analytics Configuration
  analytics: {
    enabled: true,
    trackViews: true,
    trackClicks: true,
    trackImpressions: true
  },

  // Performance
  performance: {
    batchSize: 20,
    debounceMs: 100,
    imageLoading: 'lazy'
  },

  // Tracking Configuration (Product Journey & Search History)
  tracking: {
    enabled: true,
    autoTrack: true,              // Otomatik urun takibi
    journeyLimit: 20,             // Max kaydedilecek urun
    searchHistoryLimit: 10,       // Max arama gecmisi
    productSelectors: {           // Musteriye ozel selektorler
      container: '[data-product-id]',
      id: 'data-product-id',
      title: 'data-product-title',
      price: 'data-product-price',
      image: 'data-product-image'
    }
  },

  // A/B Testing Configuration
  abTesting: {
    enabled: true,
    defaultSplit: 0.5             // A/B dagilim orani
  }
};

/**
 * Configuration Manager
 * Handles runtime configuration with multiple sources
 */
class ConfigManager {
  constructor() {
    this._config = { ...DEFAULT_CONFIG };
    this._initialized = false;
    this._callbacks = [];
  }

  /**
   * Initialize configuration from multiple sources
   *
   * @param {Object} options - Initialization options
   * @returns {Object} Merged configuration
   */
  init(options = {}) {
    if (this._initialized) {
      logger.warn('Config already initialized, use update() to modify');
      return this._config;
    }

    // 1. Start with defaults
    let config = { ...DEFAULT_CONFIG };

    // 2. Merge script tag data attributes
    const scriptConfig = this._getScriptConfig();
    if (scriptConfig) {
      config = deepMerge(config, scriptConfig);
    }

    // 3. Merge window.PWX_CONFIG if exists
    if (typeof window !== 'undefined' && window.PWX_CONFIG) {
      config = deepMerge(config, window.PWX_CONFIG);
    }

    // 4. Merge passed options
    if (options && typeof options === 'object') {
      config = deepMerge(config, options);
    }

    // Validate configuration
    this._validate(config);

    // Apply configuration
    this._config = config;
    this._initialized = true;

    // Configure logger level
    if (config.debug.enabled) {
      logger.setLevel(config.debug.logLevel);
    }

    logger.debug('Configuration initialized:', config);

    // Notify listeners
    this._notifyChange();

    return this._config;
  }

  /**
   * Get script tag configuration
   * Reads data attributes from the PWX script tag
   *
   * @returns {Object|null} Script configuration
   */
  _getScriptConfig() {
    if (typeof document === 'undefined') return null;

    // Find our script tag
    const scripts = document.querySelectorAll('script[data-pwx-customer]');

    if (scripts.length === 0) {
      // Try alternative selector
      const altScript = document.querySelector('script[src*="pwx"]');
      if (altScript) {
        return parseDataAttributes(altScript);
      }
      return null;
    }

    const scriptEl = scripts[scripts.length - 1];
    const attrs = parseDataAttributes(scriptEl);

    // Map common shorthand attributes
    const config = {};

    if (attrs.customer) {
      config.customer = { slug: attrs.customer };
    }

    if (attrs.apiKey) {
      config.customer = config.customer || {};
      config.customer.apiKey = attrs.apiKey;
    }

    if (attrs.apiUrl) {
      config.api = { baseUrl: attrs.apiUrl };
    }

    if (attrs.debug === true || attrs.debug === 'true') {
      config.debug = { enabled: true, logLevel: 'DEBUG' };
    }

    if (attrs.lazy === false || attrs.lazy === 'false') {
      config.widgets = { lazyLoad: false };
    }

    if (attrs.autoInit === false || attrs.autoInit === 'false') {
      config.widgets = config.widgets || {};
      config.widgets.autoInit = false;
    }

    // Theme attributes
    if (attrs.primaryColor) {
      config.theme = config.theme || {};
      config.theme.primaryColor = attrs.primaryColor;
    }

    return config;
  }

  /**
   * Validate configuration
   *
   * @param {Object} config - Configuration to validate
   * @throws {Error} If configuration is invalid
   */
  _validate(config) {
    // Customer slug is required for API calls
    if (!config.customer.slug && !config.api.baseUrl) {
      logger.warn('No customer slug or API URL configured');
    }

    // Validate timeout
    if (config.api.timeout < 1000) {
      logger.warn('API timeout is very low, consider increasing');
    }

    // Validate threshold
    if (config.widgets.observerThreshold < 0 || config.widgets.observerThreshold > 1) {
      config.widgets.observerThreshold = 0.1;
    }
  }

  /**
   * Update configuration
   *
   * @param {Object} updates - Configuration updates
   * @returns {Object} Updated configuration
   */
  update(updates) {
    if (!updates || typeof updates !== 'object') {
      return this._config;
    }

    this._config = deepMerge(this._config, updates);

    logger.debug('Configuration updated:', updates);

    // Update logger level if changed
    if (updates.debug) {
      logger.setLevel(this._config.debug.logLevel);
    }

    this._notifyChange();

    return this._config;
  }

  /**
   * Get configuration value
   *
   * @param {string} path - Dot-notation path (e.g., 'api.baseUrl')
   * @param {any} defaultValue - Default value if not found
   * @returns {any} Configuration value
   */
  get(path, defaultValue = undefined) {
    if (!path) {
      return this._config;
    }

    const parts = path.split('.');
    let value = this._config;

    for (const part of parts) {
      if (value === null || value === undefined || typeof value !== 'object') {
        return defaultValue;
      }
      value = value[part];
    }

    return value !== undefined ? value : defaultValue;
  }

  /**
   * Set configuration value
   *
   * @param {string} path - Dot-notation path
   * @param {any} value - Value to set
   */
  set(path, value) {
    if (!path) return;

    const parts = path.split('.');
    let current = this._config;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part] || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part];
    }

    current[parts[parts.length - 1]] = value;

    this._notifyChange();
  }

  /**
   * Get full configuration
   *
   * @returns {Object} Full configuration object
   */
  getAll() {
    return { ...this._config };
  }

  /**
   * Reset configuration to defaults
   */
  reset() {
    this._config = { ...DEFAULT_CONFIG };
    this._initialized = false;
    logger.debug('Configuration reset to defaults');
    this._notifyChange();
  }

  /**
   * Check if initialized
   *
   * @returns {boolean} True if initialized
   */
  isInitialized() {
    return this._initialized;
  }

  /**
   * Subscribe to configuration changes
   *
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  onChange(callback) {
    if (typeof callback !== 'function') return () => {};

    this._callbacks.push(callback);

    return () => {
      this._callbacks = this._callbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify change listeners
   */
  _notifyChange() {
    this._callbacks.forEach(callback => {
      try {
        callback(this._config);
      } catch (e) {
        logger.error('Config change callback error:', e);
      }
    });
  }

  /**
   * Get customer slug
   *
   * @returns {string} Customer slug
   */
  getCustomerSlug() {
    return this._config.customer.slug;
  }

  /**
   * Get API base URL
   *
   * @returns {string} API base URL
   */
  getApiUrl() {
    return this._config.api.baseUrl;
  }

  /**
   * Check if debug mode is enabled
   *
   * @returns {boolean} True if debug enabled
   */
  isDebugEnabled() {
    return this._config.debug.enabled;
  }

  /**
   * Check if analytics is enabled
   *
   * @returns {boolean} True if analytics enabled
   */
  isAnalyticsEnabled() {
    return this._config.analytics.enabled;
  }

  /**
   * Get theme value
   *
   * @param {string} key - Theme key
   * @returns {any} Theme value
   */
  getTheme(key) {
    if (!key) {
      return this._config.theme;
    }
    return this._config.theme[key];
  }

  /**
   * Update theme
   *
   * @param {Object} theme - Theme updates
   */
  setTheme(theme) {
    this._config.theme = deepMerge(this._config.theme, theme);
    this._notifyChange();
  }

  /**
   * Check if tracking is enabled
   *
   * @returns {boolean} True if tracking enabled
   */
  isTrackingEnabled() {
    return this._config.tracking.enabled;
  }

  /**
   * Get tracking configuration
   *
   * @returns {Object} Tracking config
   */
  getTrackingConfig() {
    return this._config.tracking;
  }

  /**
   * Check if A/B testing is enabled
   *
   * @returns {boolean} True if A/B testing enabled
   */
  isABTestingEnabled() {
    return this._config.abTesting.enabled;
  }

  /**
   * Get A/B testing configuration
   *
   * @returns {Object} A/B testing config
   */
  getABTestingConfig() {
    return this._config.abTesting;
  }
}

// Export singleton instance
const config = new ConfigManager();

export { ConfigManager, DEFAULT_CONFIG, config };
