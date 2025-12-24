/**
 * Widget Loader
 * Registry, mounting, and lazy loading for widgets
 *
 * @module core/loader
 */

import {
  logger,
  $$,
  parseDataAttributes,
  generateId,
  isInViewport,
  EventEmitter
} from './utils.js';
import { config } from './config.js';
import { api } from './api.js';

/**
 * Widget state enum
 * @enum {string}
 */
const WIDGET_STATE = {
  PENDING: 'pending',
  LOADING: 'loading',
  READY: 'ready',
  MOUNTED: 'mounted',
  ERROR: 'error',
  DESTROYED: 'destroyed'
};

/**
 * Widget Loader
 * Manages widget registration, initialization, and lifecycle
 */
class WidgetLoader extends EventEmitter {
  constructor() {
    super();

    /**
     * Registered widget types
     * @type {Map<string, Function>}
     */
    this._registry = new Map();

    /**
     * Widget instances
     * @type {Map<string, Object>}
     */
    this._instances = new Map();

    /**
     * Pending widget containers (for lazy loading)
     * @type {Map<HTMLElement, Object>}
     */
    this._pending = new Map();

    /**
     * Intersection observer for lazy loading
     * @type {IntersectionObserver|null}
     */
    this._observer = null;

    /**
     * Shared widget data cache
     * @type {Map<string, Object>}
     */
    this._dataCache = new Map();

    /**
     * Initialization state
     * @type {boolean}
     */
    this._initialized = false;
  }

  /**
   * Initialize the loader
   *
   * @returns {Promise<void>}
   */
  async init() {
    if (this._initialized) {
      logger.warn('Loader already initialized');
      return;
    }

    logger.debug('Initializing widget loader...');

    // Setup intersection observer for lazy loading
    if (config.get('widgets.lazyLoad')) {
      this._setupObserver();
    }

    this._initialized = true;
    this.emit('loader:init');

    logger.debug('Widget loader initialized');
  }

  /**
   * Register a widget type
   *
   * @param {string} type - Widget type name
   * @param {Function} WidgetClass - Widget constructor
   * @throws {Error} If widget type is invalid
   */
  register(type, WidgetClass) {
    if (!type || typeof type !== 'string') {
      throw new Error('Widget type must be a non-empty string');
    }

    if (typeof WidgetClass !== 'function') {
      throw new Error('Widget must be a constructor function or class');
    }

    const normalizedType = type.toLowerCase();

    if (this._registry.has(normalizedType)) {
      logger.warn(`Widget type "${type}" is already registered, overwriting`);
    }

    this._registry.set(normalizedType, WidgetClass);
    logger.debug(`Widget type registered: ${type}`);

    this.emit('widget:registered', { type: normalizedType });
  }

  /**
   * Check if widget type is registered
   *
   * @param {string} type - Widget type
   * @returns {boolean} True if registered
   */
  hasWidget(type) {
    return this._registry.has(type.toLowerCase());
  }

  /**
   * Get registered widget types
   *
   * @returns {Array<string>} Array of widget type names
   */
  getRegisteredTypes() {
    return Array.from(this._registry.keys());
  }

  /**
   * Scan DOM for widget containers and mount widgets
   *
   * @param {HTMLElement|Document} root - Root element to scan
   * @returns {Promise<Array>} Array of mounted widget instances
   */
  async scan(root = document) {
    const selector = config.get('widgets.containerSelector');
    const containers = $$(selector, root);

    logger.debug(`Found ${containers.length} widget containers`);

    const results = [];

    for (const container of containers) {
      try {
        const instance = await this._processContainer(container);
        if (instance) {
          results.push(instance);
        }
      } catch (error) {
        logger.error('Failed to process widget container:', error.message);
      }
    }

    this.emit('loader:scan', { count: results.length });

    return results;
  }

  /**
   * Process a widget container
   *
   * @param {HTMLElement} container - Widget container element
   * @returns {Promise<Object|null>} Widget instance or null
   */
  async _processContainer(container) {
    // Skip if already processed
    if (container.dataset.pwxInitialized) {
      return null;
    }

    // Parse configuration from data attributes
    const attrs = parseDataAttributes(container);

    // Get widget type
    const widgetType = attrs.widget || attrs.type;
    if (!widgetType) {
      logger.warn('Widget container missing data-pwx-widget attribute');
      return null;
    }

    // Check if widget type is registered
    if (!this.hasWidget(widgetType)) {
      logger.warn(`Unknown widget type: ${widgetType}`);
      return null;
    }

    // Generate unique ID
    const widgetId = attrs.id || generateId(`pwx-${widgetType}`);
    container.id = container.id || widgetId;

    // Create widget config
    const widgetConfig = {
      id: widgetId,
      type: widgetType,
      container,
      options: attrs,
      state: WIDGET_STATE.PENDING
    };

    // Check if widget should load immediately (bypass lazy loading)
    const immediate = attrs.immediate === 'true' || attrs.immediate === true;

    // Check for lazy loading (skip if immediate)
    if (!immediate && config.get('widgets.lazyLoad') && this._observer) {
      if (!isInViewport(container, config.get('widgets.observerThreshold'))) {
        // Add to pending and observe
        this._pending.set(container, widgetConfig);
        this._observer.observe(container);
        logger.debug(`Widget ${widgetId} queued for lazy loading`);
        return null;
      }
    }

    // Log immediate mount
    if (immediate) {
      logger.debug(`Widget ${widgetId} marked as immediate, mounting now`);
    }

    // Mount immediately
    return this._mountWidget(widgetConfig);
  }

  /**
   * Mount a widget
   *
   * @param {Object} widgetConfig - Widget configuration
   * @returns {Promise<Object>} Widget instance
   */
  async _mountWidget(widgetConfig) {
    const { id, type, container, options } = widgetConfig;

    logger.debug(`Mounting widget: ${id} (${type})`);

    // Mark as loading
    widgetConfig.state = WIDGET_STATE.LOADING;
    container.dataset.pwxInitialized = 'loading';
    container.classList.add('pwx-loading');

    try {
      // Fetch widget data if needed
      const data = await this._fetchWidgetData(type, options);

      // Get widget class
      const WidgetClass = this._registry.get(type.toLowerCase());

      // Create instance
      const instance = new WidgetClass({
        id,
        container,
        config: options,
        data,
        theme: config.getTheme()
      });

      // Store instance
      this._instances.set(id, {
        instance,
        config: widgetConfig,
        type
      });

      // Initialize widget
      await instance.init();

      // Update state
      widgetConfig.state = WIDGET_STATE.MOUNTED;
      container.dataset.pwxInitialized = 'true';
      container.classList.remove('pwx-loading');
      container.classList.add('pwx-mounted');

      // Emit events
      this.emit('widget:mounted', { id, type, instance });

      // Track impression
      if (config.isAnalyticsEnabled()) {
        this._trackImpression(id, type);
      }

      logger.debug(`Widget mounted: ${id}`);

      return instance;
    } catch (error) {
      widgetConfig.state = WIDGET_STATE.ERROR;
      container.dataset.pwxInitialized = 'error';
      container.classList.remove('pwx-loading');
      container.classList.add('pwx-error');

      logger.error(`Failed to mount widget ${id}:`, error.message);

      this.emit('widget:error', { id, type, error });

      throw error;
    }
  }

  /**
   * Fetch data for widget
   *
   * @param {string} type - Widget type
   * @param {Object} options - Widget options
   * @returns {Promise<Object>} Widget data
   */
  async _fetchWidgetData(type, options) {
    const customerSlug = options.customer || config.getCustomerSlug();

    if (!customerSlug) {
      logger.warn('No customer slug configured, using mock data');
      return { products: [], config: {} };
    }

    // Generate cache key
    const cacheKey = `${customerSlug}:${type}:${options.campaign || ''}:${options.category || ''}`;

    // Check cache
    if (this._dataCache.has(cacheKey)) {
      logger.debug('Using cached widget data');
      return this._dataCache.get(cacheKey);
    }

    // Fetch from API
    const data = await api.getWidgetData(customerSlug, {
      widgetType: type,
      campaign: options.campaign,
      category: options.category,
      limit: options.limit || 20
    });

    // Cache data
    this._dataCache.set(cacheKey, data);

    return data;
  }

  /**
   * Setup intersection observer for lazy loading
   */
  _setupObserver() {
    if (typeof IntersectionObserver === 'undefined') {
      logger.warn('IntersectionObserver not supported, disabling lazy load');
      config.set('widgets.lazyLoad', false);
      return;
    }

    const threshold = config.get('widgets.observerThreshold');

    this._observer = new IntersectionObserver(
      (entries) => this._onIntersection(entries),
      {
        root: null,
        rootMargin: '50px',
        threshold: threshold
      }
    );

    logger.debug('Intersection observer created');
  }

  /**
   * Handle intersection observer callback
   *
   * @param {Array<IntersectionObserverEntry>} entries - Observer entries
   */
  async _onIntersection(entries) {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const container = entry.target;
        const widgetConfig = this._pending.get(container);

        if (widgetConfig) {
          // Stop observing
          this._observer.unobserve(container);
          this._pending.delete(container);

          // Mount widget
          try {
            await this._mountWidget(widgetConfig);
          } catch (error) {
            logger.error('Lazy mount failed:', error.message);
          }
        }
      }
    }
  }

  /**
   * Get widget instance by ID
   *
   * @param {string} id - Widget ID
   * @returns {Object|null} Widget instance or null
   */
  getInstance(id) {
    const entry = this._instances.get(id);
    return entry ? entry.instance : null;
  }

  /**
   * Get all widget instances
   *
   * @returns {Array<Object>} Array of widget instances
   */
  getAllInstances() {
    return Array.from(this._instances.values()).map(entry => entry.instance);
  }

  /**
   * Get instances by type
   *
   * @param {string} type - Widget type
   * @returns {Array<Object>} Array of widget instances
   */
  getInstancesByType(type) {
    const normalizedType = type.toLowerCase();
    return Array.from(this._instances.values())
      .filter(entry => entry.type === normalizedType)
      .map(entry => entry.instance);
  }

  /**
   * Destroy a widget
   *
   * @param {string} id - Widget ID
   * @returns {boolean} True if destroyed
   */
  destroy(id) {
    const entry = this._instances.get(id);

    if (!entry) {
      logger.warn(`Widget not found: ${id}`);
      return false;
    }

    try {
      // Call widget destroy method
      if (typeof entry.instance.destroy === 'function') {
        entry.instance.destroy();
      }

      // Clean up container
      const container = entry.config.container;
      if (container) {
        container.classList.remove('pwx-loading', 'pwx-mounted', 'pwx-error');
        delete container.dataset.pwxInitialized;
        container.innerHTML = '';
      }

      // Remove from instances
      this._instances.delete(id);

      this.emit('widget:destroyed', { id, type: entry.type });

      logger.debug(`Widget destroyed: ${id}`);

      return true;
    } catch (error) {
      logger.error(`Failed to destroy widget ${id}:`, error.message);
      return false;
    }
  }

  /**
   * Destroy all widgets
   */
  destroyAll() {
    const ids = Array.from(this._instances.keys());
    ids.forEach(id => this.destroy(id));

    logger.debug('All widgets destroyed');
  }

  /**
   * Refresh widget data
   *
   * @param {string} id - Widget ID
   * @returns {Promise<void>}
   */
  async refresh(id) {
    const entry = this._instances.get(id);

    if (!entry) {
      throw new Error(`Widget not found: ${id}`);
    }

    // Clear cache for this widget
    const options = entry.config.options;
    const customerSlug = options.customer || config.getCustomerSlug();
    const cacheKey = `${customerSlug}:${entry.type}:${options.campaign || ''}:${options.category || ''}`;
    this._dataCache.delete(cacheKey);

    // Fetch fresh data
    const data = await this._fetchWidgetData(entry.type, options);

    // Update widget
    if (typeof entry.instance.update === 'function') {
      await entry.instance.update(data);
    }

    this.emit('widget:refreshed', { id, type: entry.type });

    logger.debug(`Widget refreshed: ${id}`);
  }

  /**
   * Refresh all widgets
   *
   * @returns {Promise<void>}
   */
  async refreshAll() {
    // Clear all cached data
    this._dataCache.clear();

    const promises = Array.from(this._instances.keys()).map(id =>
      this.refresh(id).catch(error => {
        logger.error(`Failed to refresh widget ${id}:`, error.message);
      })
    );

    await Promise.all(promises);

    logger.debug('All widgets refreshed');
  }

  /**
   * Track widget impression
   *
   * @param {string} widgetId - Widget ID
   * @param {string} widgetType - Widget type
   */
  _trackImpression(widgetId, widgetType) {
    const customerSlug = config.getCustomerSlug();

    if (customerSlug) {
      api.trackEvent(customerSlug, {
        type: 'impression',
        widgetId,
        widgetType
      });
    }
  }

  /**
   * Get loader statistics
   *
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      registeredTypes: this._registry.size,
      mountedWidgets: this._instances.size,
      pendingWidgets: this._pending.size,
      cachedData: this._dataCache.size
    };
  }

  /**
   * Clear data cache
   */
  clearCache() {
    this._dataCache.clear();
    api.clearCache();
    logger.debug('Widget data cache cleared');
  }
}

// Export singleton instance
const loader = new WidgetLoader();

export { WidgetLoader, WIDGET_STATE, loader };
