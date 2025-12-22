/**
 * ProWidget CDN Entry Point
 * Global namespace and auto-initialization
 *
 * @module core/init
 */

import {
  logger,
  domReady,
  EventEmitter,
  generateId,
  formatPrice,
  escapeHtml,
  storage
} from './utils.js';
import { config, DEFAULT_CONFIG } from './config.js';
import { api, ApiError } from './api.js';
import { loader, WIDGET_STATE } from './loader.js';

// Personalization modules
import { storage as pwxStorage, STORAGE_KEYS } from './storage.js';
import { tracker, Tracker } from './tracker.js';
import { abTest, ABTestManager } from './ab-testing.js';

// Static widget imports (bundled together)
import CarouselWidget from '../widgets/carousel.js';
import BannerWidget from '../widgets/banner.js';
import PopupWidget from '../widgets/popup.js';
import GridWidget from '../widgets/grid.js';
import SliderWidget from '../widgets/slider.js';
import CustomWidget from '../widgets/custom.js';
import RecentlyViewedWidget from '../widgets/recently-viewed.js';

/**
 * ProWidget Framework Version
 */
const VERSION = '1.0.0';

/**
 * Check if we're in a browser environment
 */
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

/**
 * Global PWX namespace
 * This is the main interface exposed to customers
 */
class PWX extends EventEmitter {
  constructor() {
    super();

    this.version = VERSION;
    this._initialized = false;
    this._ready = false;
    this._readyCallbacks = [];

    /**
     * Tracker instance for product journey & search history
     * @type {Tracker}
     */
    this.tracker = tracker;

    /**
     * A/B Test manager instance
     * @type {ABTestManager}
     */
    this.abTest = abTest;
  }

  /**
   * Initialize the framework
   *
   * @param {Object} options - Configuration options
   * @returns {Promise<void>}
   */
  async init(options = {}) {
    if (this._initialized) {
      logger.warn('PWX already initialized');
      return;
    }

    logger.info(`ProWidget v${VERSION} initializing...`);

    try {
      // Initialize configuration
      const cfg = config.init(options);

      // Configure API client
      api.configure({
        baseUrl: cfg.api.baseUrl,
        apiKey: cfg.customer.apiKey,
        timeout: cfg.api.timeout,
        retries: cfg.api.retries,
        cacheTimeout: cfg.api.cacheTimeout
      });

      // Initialize loader
      await loader.init();

      // Initialize tracker with config
      if (cfg.tracking && cfg.tracking.enabled) {
        this._initTracker(cfg.tracking);
      }

      // Initialize A/B testing with config
      if (cfg.abTesting && cfg.abTesting.enabled) {
        this._initABTesting(cfg.abTesting);
      }

      // Import and register built-in widgets
      await this._registerBuiltInWidgets();

      this._initialized = true;

      // Auto-render widgets from API config
      if (cfg.widgets.autoRender) {
        await this._autoRenderWidgets();
      }

      // Auto-scan if enabled
      if (cfg.widgets.autoInit) {
        await this.scan();
      }

      // Auto-track product if on product page
      if (cfg.tracking && cfg.tracking.autoTrack) {
        this._autoTrackProduct();
      }

      this._ready = true;
      this.emit('ready');

      // Execute ready callbacks
      this._readyCallbacks.forEach(cb => {
        try {
          cb(this);
        } catch (e) {
          logger.error('Ready callback error:', e);
        }
      });
      this._readyCallbacks = [];

      logger.info('ProWidget initialized successfully');
    } catch (error) {
      logger.error('PWX initialization failed:', error.message);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Register built-in widgets
   *
   * @returns {Promise<void>}
   */
  async _registerBuiltInWidgets() {
    // Register all built-in widgets (statically imported)
    try {
      const widgets = [
        CarouselWidget,
        BannerWidget,
        PopupWidget,
        GridWidget,
        SliderWidget,
        CustomWidget,
        RecentlyViewedWidget
      ];

      widgets.forEach(Widget => {
        if (Widget && Widget.type) {
          this.registerWidget(Widget.type, Widget);
        }
      });

      logger.debug('Built-in widgets registered');
    } catch (error) {
      logger.debug('Failed to register widgets:', error.message);
    }
  }

  /**
   * Initialize tracker with configuration
   * @private
   * @param {Object} trackingConfig - Tracking configuration
   */
  _initTracker(trackingConfig) {
    this.tracker = new Tracker({
      enabled: trackingConfig.enabled,
      journeyLimit: trackingConfig.journeyLimit || 20,
      searchHistoryLimit: trackingConfig.searchHistoryLimit || 10
    });

    logger.debug('Tracker initialized');
  }

  /**
   * Initialize A/B testing with configuration
   * @private
   * @param {Object} abConfig - A/B testing configuration
   */
  _initABTesting(abConfig) {
    this.abTest = new ABTestManager(pwxStorage, {
      enabled: abConfig.enabled,
      defaultSplit: abConfig.defaultSplit || 0.5
    });

    logger.debug('A/B Testing initialized');
  }

  /**
   * Auto-track product on product pages
   * Detects product data from page and tracks view
   * @private
   */
  _autoTrackProduct() {
    const productData = this._extractProductData();

    if (productData) {
      this.tracker.trackProductView(productData);
      logger.debug('Product auto-tracked:', productData.id);
    }
  }

  /**
   * Extract product data from page
   * Supports JSON-LD, data attributes, and global objects
   * @private
   * @returns {Object|null} Product data or null
   */
  _extractProductData() {
    // 1. Try JSON-LD structured data
    try {
      const jsonLdElements = document.querySelectorAll('script[type="application/ld+json"]');
      for (const jsonLd of jsonLdElements) {
        const data = JSON.parse(jsonLd.textContent);

        // Handle @graph format
        const productData = data['@type'] === 'Product' ? data :
          (data['@graph']?.find(item => item['@type'] === 'Product'));

        if (productData) {
          return {
            id: productData.sku || productData.productID || productData.identifier,
            title: productData.name,
            price: productData.offers?.price || productData.offers?.[0]?.price,
            image: Array.isArray(productData.image) ? productData.image[0] : productData.image,
            url: window.location.href,
            brand: productData.brand?.name || productData.brand,
            category: productData.category
          };
        }
      }
    } catch (e) {
      // JSON-LD parse error, continue to other methods
    }

    // 2. Try global product objects (common e-commerce patterns)
    if (typeof window !== 'undefined') {
      // Pattern: window.productDetailModel (Trendyol-like)
      if (window.productDetailModel) {
        const p = window.productDetailModel;
        return {
          id: p.productId || p.id,
          title: p.name || p.title,
          price: p.price?.sellingPrice || p.price,
          image: p.images?.[0] || p.image,
          url: window.location.href,
          brand: p.brand?.name || p.brand,
          category: p.category?.name
        };
      }

      // Pattern: window.product
      if (window.product) {
        const p = window.product;
        return {
          id: p.id || p.sku,
          title: p.name || p.title,
          price: p.price,
          image: p.image || p.images?.[0],
          url: window.location.href,
          brand: p.brand,
          category: p.category
        };
      }

      // Pattern: dataLayer product
      if (window.dataLayer) {
        for (const item of window.dataLayer) {
          if (item.ecommerce?.detail?.products?.[0]) {
            const p = item.ecommerce.detail.products[0];
            return {
              id: p.id,
              title: p.name,
              price: p.price,
              image: null, // Usually not in dataLayer
              url: window.location.href,
              brand: p.brand,
              category: p.category
            };
          }
        }
      }
    }

    // 3. Try data attributes
    const trackingConfig = config.getTrackingConfig();
    const selectors = trackingConfig.productSelectors || {};

    const container = document.querySelector(selectors.container || '[data-product-id]');
    if (container) {
      return {
        id: container.getAttribute(selectors.id || 'data-product-id'),
        title: container.getAttribute(selectors.title || 'data-product-title'),
        price: container.getAttribute(selectors.price || 'data-product-price'),
        image: container.getAttribute(selectors.image || 'data-product-image'),
        url: window.location.href
      };
    }

    // 4. Try meta tags
    const metaProductId = document.querySelector('meta[property="product:id"], meta[name="product:id"]');
    if (metaProductId) {
      return {
        id: metaProductId.getAttribute('content'),
        title: document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
        price: document.querySelector('meta[property="product:price:amount"]')?.getAttribute('content'),
        image: document.querySelector('meta[property="og:image"]')?.getAttribute('content'),
        url: window.location.href
      };
    }

    return null;
  }

  /**
   * Detect page type
   * @private
   * @returns {string} Page type: 'product', 'category', 'search', 'home', 'other'
   */
  _detectPageType() {
    const url = window.location.href.toLowerCase();
    const path = window.location.pathname.toLowerCase();

    // Check for product page indicators
    if (this._extractProductData()) {
      return 'product';
    }

    // URL patterns
    if (path.includes('/product') || path.includes('/urun') || path.includes('/p/')) {
      return 'product';
    }

    if (path.includes('/category') || path.includes('/kategori') || path.includes('/c/')) {
      return 'category';
    }

    if (path.includes('/search') || path.includes('/ara') || url.includes('q=') || url.includes('search=')) {
      return 'search';
    }

    if (path === '/' || path === '/index.html' || path === '/home') {
      return 'home';
    }

    return 'other';
  }

  /**
   * Auto-render widgets from API configuration
   * Fetches widget config from API and creates containers
   *
   * @returns {Promise<void>}
   */
  async _autoRenderWidgets() {
    const slug = config.get('customer.slug');
    if (!slug) {
      logger.debug('No customer slug, skipping auto-render');
      return;
    }

    try {
      logger.debug('Fetching widget config for auto-render...');
      const widgetConfig = await api.getWidgetConfig(slug);
      const widgets = widgetConfig.widgets || [];

      if (widgets.length === 0) {
        logger.debug('No widgets configured for auto-render');
        return;
      }

      logger.debug(`Auto-rendering ${widgets.length} widget(s)`);

      for (const widget of widgets) {
        this._createWidgetContainer(widget);
      }

      this.emit('autorender:complete', { count: widgets.length });
    } catch (error) {
      logger.warn('Auto-render failed:', error.message);
      this.emit('autorender:error', error);
    }
  }

  /**
   * Create a widget container element
   *
   * @param {Object} widget - Widget configuration from API
   */
  _createWidgetContainer(widget) {
    if (!widget || !widget.type) {
      logger.warn('Invalid widget config, skipping');
      return;
    }

    // Parse placement - can be string (selector) or object ({ selector, position })
    const placement = this._parsePlacement(widget.placement);

    // Determine target element
    let target = placement.selector ? document.querySelector(placement.selector) : null;

    // If selector not found, retry with delay (for dynamic content like Ticimax)
    if (!target && placement.selector && placement.selector !== 'body') {
      logger.debug(`PWX: Selector "${placement.selector}" not found, will retry...`);
      this._retryPlacement(widget, placement, 3, 500);
      return;
    }

    // Fallback to autoRenderTarget or body
    if (!target) {
      const fallbackSelector = config.get('widgets.autoRenderTarget');
      target = fallbackSelector ? document.querySelector(fallbackSelector) : null;

      if (!target) {
        logger.warn(`PWX: Selector "${placement.selector}" not found, using body`);
        target = document.body;
      }
    }

    // Create container element
    const container = document.createElement('div');
    container.dataset.pwxWidget = widget.type.toLowerCase();
    container.dataset.pwxWidgetId = widget.id;
    container.dataset.pwxAutoRendered = 'true';

    // Apply widget name as title if available
    if (widget.name) {
      container.dataset.pwxName = widget.name;
    }

    // Store placement info for debugging
    if (placement.selector) {
      container.dataset.pwxPlacement = placement.selector;
    }

    // Apply settings as data attributes
    if (widget.settings && typeof widget.settings === 'object') {
      Object.entries(widget.settings).forEach(([key, value]) => {
        const attrName = `pwx${key.charAt(0).toUpperCase()}${key.slice(1)}`;
        container.dataset[attrName] = typeof value === 'object' ? JSON.stringify(value) : value;
      });
    }

    // For custom widgets, store template and customData
    if (widget.type === 'custom') {
      if (widget.template) {
        container.dataset.pwxTemplate = JSON.stringify(widget.template);
      }
      if (widget.customData) {
        container.dataset.pwxCustomData = JSON.stringify(widget.customData);
      }
    }

    // Apply placement position
    if (placement.position === 'prepend') {
      target.prepend(container);
    } else {
      target.appendChild(container);
    }

    logger.debug(`Created container for widget: ${widget.type} (${widget.id}) at ${placement.selector || 'body'}`);
  }

  /**
   * Parse placement configuration
   * Supports both string and object formats
   *
   * @param {string|Object|undefined} placement - Placement config
   * @returns {Object} Parsed placement { selector, position }
   */
  _parsePlacement(placement) {
    const defaultPlacement = {
      selector: config.get('widgets.autoRenderTarget') || '#pwx-widgets',
      position: 'append'
    };

    // Default
    if (!placement) {
      return defaultPlacement;
    }

    // Object format: { selector, position }
    if (typeof placement === 'object') {
      return {
        selector: placement.selector || defaultPlacement.selector,
        position: placement.position || 'append'
      };
    }

    // String format - try JSON parse first for {"selector":"...", "position":"prepend"}
    if (typeof placement === 'string') {
      if (placement.startsWith('{')) {
        try {
          const parsed = JSON.parse(placement);
          return {
            selector: parsed.selector || placement,
            position: parsed.position || 'append'
          };
        } catch (e) {
          // Not valid JSON, use as selector
        }
      }
      return {
        selector: placement,
        position: 'append'
      };
    }

    return defaultPlacement;
  }

  /**
   * Retry placement for dynamic content
   * Waits for selector to appear in DOM
   *
   * @param {Object} widget - Widget configuration
   * @param {Object} placement - Parsed placement
   * @param {number} retries - Number of retries remaining
   * @param {number} delay - Delay between retries in ms
   */
  _retryPlacement(widget, placement, retries, delay) {
    if (retries <= 0) {
      logger.warn(`PWX: Selector "${placement.selector}" not found after retries, using body`);
      // Create container in body as fallback
      this._createContainerInTarget(widget, placement, document.body);
      return;
    }

    setTimeout(() => {
      const target = document.querySelector(placement.selector);
      if (target) {
        logger.debug(`PWX: Found "${placement.selector}" on retry`);
        this._createContainerInTarget(widget, placement, target);
      } else {
        this._retryPlacement(widget, placement, retries - 1, delay);
      }
    }, delay);
  }

  /**
   * Create container in specific target element
   *
   * @param {Object} widget - Widget configuration
   * @param {Object} placement - Parsed placement
   * @param {HTMLElement} target - Target element
   */
  _createContainerInTarget(widget, placement, target) {
    // Create container element
    const container = document.createElement('div');
    container.dataset.pwxWidget = widget.type.toLowerCase();
    container.dataset.pwxWidgetId = widget.id;
    container.dataset.pwxAutoRendered = 'true';

    if (widget.name) {
      container.dataset.pwxName = widget.name;
    }

    if (placement.selector) {
      container.dataset.pwxPlacement = placement.selector;
    }

    if (widget.settings && typeof widget.settings === 'object') {
      Object.entries(widget.settings).forEach(([key, value]) => {
        const attrName = `pwx${key.charAt(0).toUpperCase()}${key.slice(1)}`;
        container.dataset[attrName] = typeof value === 'object' ? JSON.stringify(value) : value;
      });
    }

    if (widget.type === 'custom') {
      if (widget.template) {
        container.dataset.pwxTemplate = JSON.stringify(widget.template);
      }
      if (widget.customData) {
        container.dataset.pwxCustomData = JSON.stringify(widget.customData);
      }
    }

    // Apply placement position
    if (placement.position === 'prepend') {
      target.prepend(container);
    } else {
      target.appendChild(container);
    }

    logger.debug(`Created container for widget: ${widget.type} (${widget.id}) at ${placement.selector || 'body'}`);

    // Trigger scan to mount the widget
    loader.scan(container.parentElement);
  }

  /**
   * Register a custom widget
   *
   * @param {string} type - Widget type name
   * @param {Function} WidgetClass - Widget constructor
   */
  registerWidget(type, WidgetClass) {
    loader.register(type, WidgetClass);
  }

  /**
   * Scan DOM for widgets and mount them
   *
   * @param {HTMLElement|Document} root - Root element to scan
   * @returns {Promise<Array>} Mounted widget instances
   */
  async scan(root = document) {
    return loader.scan(root);
  }

  /**
   * Mount a widget to a specific container
   *
   * @param {string|HTMLElement} container - Container selector or element
   * @param {string} type - Widget type
   * @param {Object} options - Widget options
   * @returns {Promise<Object>} Widget instance
   */
  async mount(container, type, options = {}) {
    // Resolve container
    const element = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    if (!element) {
      throw new Error(`Container not found: ${container}`);
    }

    // Set data attributes
    element.dataset.pwxWidget = type;
    Object.entries(options).forEach(([key, value]) => {
      if (typeof value === 'object') {
        element.dataset[`pwx${key.charAt(0).toUpperCase()}${key.slice(1)}`] = JSON.stringify(value);
      } else {
        element.dataset[`pwx${key.charAt(0).toUpperCase()}${key.slice(1)}`] = value;
      }
    });

    // Scan just this element
    const results = await loader.scan(element.parentElement || document);

    return results[0] || null;
  }

  /**
   * Get widget instance by ID
   *
   * @param {string} id - Widget ID
   * @returns {Object|null} Widget instance
   */
  get(id) {
    return loader.getInstance(id);
  }

  /**
   * Get all widget instances
   *
   * @returns {Array<Object>} Widget instances
   */
  getAll() {
    return loader.getAllInstances();
  }

  /**
   * Destroy a widget
   *
   * @param {string} id - Widget ID
   * @returns {boolean} Success
   */
  destroy(id) {
    return loader.destroy(id);
  }

  /**
   * Destroy all widgets
   */
  destroyAll() {
    loader.destroyAll();
  }

  /**
   * Refresh widget data
   *
   * @param {string} id - Widget ID (optional, refreshes all if not provided)
   * @returns {Promise<void>}
   */
  async refresh(id) {
    if (id) {
      await loader.refresh(id);
    } else {
      await loader.refreshAll();
    }
  }

  /**
   * Update configuration
   *
   * @param {Object} options - Configuration updates
   */
  configure(options) {
    config.update(options);

    // Update API client if needed
    if (options.api) {
      api.configure(options.api);
    }
  }

  /**
   * Execute callback when PWX is ready
   *
   * @param {Function} callback - Callback function
   */
  ready(callback) {
    if (typeof callback !== 'function') return;

    if (this._ready) {
      callback(this);
    } else {
      this._readyCallbacks.push(callback);
    }
  }

  /**
   * Check if initialized
   *
   * @returns {boolean} True if initialized
   */
  isReady() {
    return this._ready;
  }

  /**
   * Get current configuration
   *
   * @param {string} path - Config path (optional)
   * @returns {any} Configuration value
   */
  getConfig(path) {
    return config.get(path);
  }

  /**
   * Set theme
   *
   * @param {Object} theme - Theme options
   */
  setTheme(theme) {
    config.setTheme(theme);
    this.emit('theme:change', theme);
  }

  /**
   * Get statistics
   *
   * @returns {Object} Statistics
   */
  getStats() {
    return loader.getStats();
  }

  /**
   * Clear all caches
   */
  clearCache() {
    loader.clearCache();
  }

  // ========================================
  // Exposed Utilities
  // ========================================

  /**
   * Utility functions
   */
  utils = {
    formatPrice,
    escapeHtml,
    generateId,
    storage
  };

  /**
   * Constants
   */
  constants = {
    VERSION,
    WIDGET_STATE,
    DEFAULT_CONFIG
  };

  /**
   * API client access (for advanced usage)
   */
  get api() {
    return api;
  }

  /**
   * Config access (for advanced usage)
   */
  get config() {
    return config;
  }

  /**
   * Loader access (for advanced usage)
   */
  get loader() {
    return loader;
  }
}

// ========================================
// Auto-Initialization
// ========================================

/**
 * Create global instance
 */
const pwx = new PWX();

/**
 * Check if selector mode is active
 * @returns {boolean}
 */
function isSelectorMode() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('pwx_select') === '1';
}

/**
 * Load selector agent dynamically
 * Injects the selector-agent.js script
 */
function loadSelectorAgent() {
  // Find the current script's base URL
  const currentScript = document.currentScript ||
    document.querySelector('script[src*="pwx"]') ||
    document.querySelector('script[data-pwx-customer]');

  let baseUrl = '';
  if (currentScript && currentScript.src) {
    // Extract base URL from current script
    const url = new URL(currentScript.src);
    baseUrl = url.origin + url.pathname.replace(/\/[^/]+$/, '');
  } else if (currentScript && currentScript.dataset.pwxApiUrl) {
    // Use API URL as base
    baseUrl = currentScript.dataset.pwxApiUrl + '/cdn';
  }

  // Create and inject selector-agent script
  const script = document.createElement('script');
  script.src = baseUrl + '/selector-agent.min.js';
  script.async = true;
  script.onload = () => {
    logger.info('[PWX] Selector agent loaded');
  };
  script.onerror = () => {
    logger.error('[PWX] Failed to load selector agent');
    // Fallback: inline selector
    inlineSelector();
  };

  document.head.appendChild(script);
}

/**
 * Inline fallback selector (minimal version)
 * Used when selector-agent.js can't be loaded
 */
function inlineSelector() {
  const HIGHLIGHT_COLOR = '#3b82f6';
  const SELECTED_COLOR = '#22c55e';

  let highlightOverlay = null;
  let selectedElement = null;

  // Create styles
  const styles = document.createElement('style');
  styles.textContent = `
    .pwx-selector-ui {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .pwx-selector-toolbar {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 20px;
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .pwx-selector-logo {
      font-weight: 700;
      font-size: 14px;
      padding: 6px 12px;
      background: rgba(255,255,255,0.2);
      border-radius: 6px;
    }
    .pwx-selector-info { flex: 1; font-size: 14px; opacity: 0.9; }
    .pwx-selector-cancel {
      padding: 8px 16px;
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 6px;
      color: white;
      font-size: 13px;
      cursor: pointer;
    }
    .pwx-selector-highlight {
      position: fixed;
      pointer-events: none;
      border: 2px solid ${HIGHLIGHT_COLOR};
      background: rgba(59, 130, 246, 0.1);
      z-index: 2147483646;
    }
    .pwx-selector-highlight.selected {
      border-color: ${SELECTED_COLOR};
      background: rgba(34, 197, 94, 0.1);
    }
  `;
  document.head.appendChild(styles);

  // Create UI
  const ui = document.createElement('div');
  ui.className = 'pwx-selector-ui';
  ui.innerHTML = '<div class="pwx-selector-toolbar">' +
    '<div class="pwx-selector-logo">PWX Selector</div>' +
    '<div class="pwx-selector-info">Widget yerleştirmek istediğiniz elementi tıklayın</div>' +
    '<button class="pwx-selector-cancel">İptal</button>' +
    '</div>';
  document.body.appendChild(ui);

  // Create highlight overlay
  highlightOverlay = document.createElement('div');
  highlightOverlay.className = 'pwx-selector-highlight';
  document.body.appendChild(highlightOverlay);

  // Event handlers
  function highlight(el) {
    if (!el || el.closest('.pwx-selector-ui')) {
      highlightOverlay.style.display = 'none';
      return;
    }
    const rect = el.getBoundingClientRect();
    highlightOverlay.style.display = 'block';
    highlightOverlay.style.top = rect.top + window.scrollY + 'px';
    highlightOverlay.style.left = rect.left + window.scrollX + 'px';
    highlightOverlay.style.width = rect.width + 'px';
    highlightOverlay.style.height = rect.height + 'px';
  }

  function generateSelector(el) {
    if (el.id) return '#' + el.id;
    let path = [];
    while (el && el !== document.body) {
      let seg = el.tagName.toLowerCase();
      if (el.className && typeof el.className === 'string') {
        const cls = el.className.split(' ').filter(c => c && !c.startsWith('pwx-'))[0];
        if (cls) seg += '.' + cls;
      }
      path.unshift(seg);
      el = el.parentElement;
    }
    return path.slice(-3).join(' > ');
  }

  document.addEventListener('mouseover', e => highlight(e.target));
  document.addEventListener('click', e => {
    if (e.target.closest('.pwx-selector-ui')) return;
    e.preventDefault();
    e.stopPropagation();

    selectedElement = e.target;
    const selector = generateSelector(selectedElement);
    highlightOverlay.classList.add('selected');

    // Send to opener
    const data = { type: 'PWX_SELECTOR_RESULT', status: 'selected', selector };
    localStorage.setItem('pwx_selector_session', JSON.stringify({ ...data, timestamp: Date.now() }));
    if (window.opener) window.opener.postMessage(data, '*');

    // Show success
    alert('Seçim tamamlandı: ' + selector + '\n\nAdmin panele dönebilirsiniz.');
    cleanup();
  }, true);

  ui.querySelector('.pwx-selector-cancel').addEventListener('click', () => {
    const data = { type: 'PWX_SELECTOR_RESULT', status: 'cancelled' };
    localStorage.setItem('pwx_selector_session', JSON.stringify({ ...data, timestamp: Date.now() }));
    if (window.opener) window.opener.postMessage(data, '*');
    cleanup();
  });

  function cleanup() {
    ui.remove();
    highlightOverlay.remove();
    styles.remove();
  }
}

/**
 * Auto-initialize on DOM ready if in browser
 */
if (isBrowser) {
  // Expose to global namespace
  window.PWX = pwx;

  // Check if selector mode is active FIRST (before any init)
  if (isSelectorMode()) {
    logger.info('[PWX] Selector mode detected');
    domReady(() => loadSelectorAgent());
    // Don't continue with normal initialization in selector mode
  } else {
    // Check for existing queue
    if (window.PWX_QUEUE && Array.isArray(window.PWX_QUEUE)) {
      // Process queued method calls
      window.PWX_QUEUE.forEach(([method, ...args]) => {
        if (typeof pwx[method] === 'function') {
          pwx[method](...args);
        }
      });
    }

    // Auto-initialize when DOM is ready
    domReady(async () => {
      // Check if auto-init is disabled via script tag
      const scripts = document.querySelectorAll('script[data-pwx-auto-init="false"]');
      if (scripts.length > 0) {
        logger.debug('Auto-init disabled via script attribute');
        return;
      }

      // Check if customer slug is configured
      const scriptWithCustomer = document.querySelector('script[data-pwx-customer]');
      if (!scriptWithCustomer && !window.PWX_CONFIG) {
        logger.debug('No customer configured, skipping auto-init');
        return;
      }

      // Initialize
      try {
        await pwx.init();
      } catch (error) {
        logger.error('Auto-initialization failed:', error.message);
      }
    });
  }
}

// ========================================
// Exports
// ========================================

export default pwx;

export {
  pwx as PWX,
  VERSION,
  config,
  api,
  loader,
  WIDGET_STATE,
  ApiError,
  // Personalization exports
  tracker,
  Tracker,
  abTest,
  ABTestManager,
  pwxStorage,
  STORAGE_KEYS
};
