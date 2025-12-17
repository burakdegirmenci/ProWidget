/**
 * Base Widget
 * Abstract base class for all widgets (Open/Closed Principle)
 *
 * @module widgets/BaseWidget
 */

import {
  logger,
  createElement,
  addStyles,
  generateId,
  escapeHtml,
  formatPrice,
  EventEmitter,
  debounce
} from '../core/utils.js';
import { config } from '../core/config.js';
import { api } from '../core/api.js';

/**
 * Base Widget Class
 * All widgets should extend this class
 *
 * @abstract
 */
class BaseWidget extends EventEmitter {
  /**
   * Widget type name - must be overridden by subclass
   * @type {string}
   */
  static type = 'base';

  /**
   * Default widget options - can be extended by subclass
   * @type {Object}
   */
  static defaultOptions = {
    animate: true,
    showPrice: true,
    showTitle: true,
    showImage: true,
    imageLoading: 'lazy',
    linkTarget: '_blank',
    currency: 'TRY',
    locale: 'tr-TR',
    cssPrefix: 'pwx'
  };

  /**
   * Create a widget instance
   *
   * @param {Object} params - Widget parameters
   * @param {string} params.id - Unique widget ID
   * @param {HTMLElement} params.container - Container element
   * @param {Object} params.config - Widget configuration
   * @param {Object} params.data - Widget data
   * @param {Object} params.theme - Theme configuration
   */
  constructor({ id, container, config: widgetConfig = {}, data = {}, theme = {} }) {
    super();

    // Validate container
    if (!container || !(container instanceof HTMLElement)) {
      throw new Error('BaseWidget: valid container element is required');
    }

    /**
     * Unique widget ID
     * @type {string}
     */
    this.id = id || generateId(this.constructor.type);

    /**
     * Container element
     * @type {HTMLElement}
     */
    this.container = container;

    /**
     * Merged options (defaults + config)
     * @type {Object}
     */
    this.options = {
      ...this.constructor.defaultOptions,
      ...widgetConfig
    };

    /**
     * Widget data
     * @type {Object}
     */
    this.data = data;

    /**
     * Products array
     * @type {Array}
     */
    this.products = data.products || [];

    /**
     * Theme configuration
     * @type {Object}
     */
    this.theme = {
      ...config.getTheme(),
      ...theme
    };

    /**
     * Widget state
     * @type {Object}
     */
    this.state = {
      initialized: false,
      rendered: false,
      destroyed: false
    };

    /**
     * Child elements reference
     * @type {Object}
     */
    this.elements = {};

    /**
     * Event listeners for cleanup
     * @type {Array}
     */
    this._listeners = [];

    /**
     * CSS prefix for BEM naming
     * @type {string}
     */
    this.cssPrefix = this.options.cssPrefix || 'pwx';

    /**
     * Widget type
     * @type {string}
     */
    this.type = this.constructor.type;

    logger.debug(`BaseWidget: Creating ${this.type} widget`, { id: this.id });
  }

  /**
   * Initialize the widget
   * Template method pattern - calls hooks in sequence
   *
   * @returns {Promise<void>}
   */
  async init() {
    if (this.state.initialized) {
      logger.warn(`Widget ${this.id} already initialized`);
      return;
    }

    try {
      // Hook: Before init
      await this.beforeInit();

      // Inject styles
      this._injectStyles();

      // Setup container
      this._setupContainer();

      // Render widget
      await this.render();

      // Bind events
      this._bindEvents();

      // Hook: After init
      await this.afterInit();

      this.state.initialized = true;
      this.emit('init', { id: this.id });

      logger.debug(`Widget ${this.id} initialized`);
    } catch (error) {
      logger.error(`Widget ${this.id} initialization failed:`, error.message);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Hook: Called before initialization
   * Override in subclass for custom pre-init logic
   *
   * @returns {Promise<void>}
   */
  async beforeInit() {
    // Override in subclass
  }

  /**
   * Hook: Called after initialization
   * Override in subclass for custom post-init logic
   *
   * @returns {Promise<void>}
   */
  async afterInit() {
    // Override in subclass
  }

  /**
   * Setup container element
   * @protected
   */
  _setupContainer() {
    this.container.classList.add(
      `${this.cssPrefix}-widget`,
      `${this.cssPrefix}-${this.type}`
    );
    this.container.setAttribute('data-pwx-id', this.id);
    this.container.setAttribute('data-pwx-type', this.type);

    // Apply theme styles as CSS variables
    this._applyThemeVars();
  }

  /**
   * Apply theme as CSS variables
   * @protected
   */
  _applyThemeVars() {
    const style = this.container.style;

    if (this.theme.primaryColor) {
      style.setProperty('--pwx-primary-color', this.theme.primaryColor);
    }
    if (this.theme.secondaryColor) {
      style.setProperty('--pwx-secondary-color', this.theme.secondaryColor);
    }
    if (this.theme.fontFamily) {
      style.setProperty('--pwx-font-family', this.theme.fontFamily);
    }
    if (this.theme.borderRadius) {
      style.setProperty('--pwx-border-radius', this.theme.borderRadius);
    }
    if (this.theme.shadow) {
      style.setProperty('--pwx-shadow', this.theme.shadow);
    }
  }

  /**
   * Inject widget styles
   * @protected
   */
  _injectStyles() {
    const styleId = `${this.cssPrefix}-${this.type}-styles`;

    // Check if styles already injected
    if (document.getElementById(styleId)) {
      return;
    }

    const css = this.getStyles();
    if (css) {
      addStyles(css, styleId);
    }
  }

  /**
   * Get widget CSS styles
   * Override in subclass to provide custom styles
   *
   * @returns {string} CSS string
   */
  getStyles() {
    return `
      /* Base Widget Styles */
      .${this.cssPrefix}-widget {
        font-family: var(--pwx-font-family, inherit);
        box-sizing: border-box;
        position: relative;
      }

      .${this.cssPrefix}-widget * {
        box-sizing: border-box;
      }

      .${this.cssPrefix}-widget.pwx-loading {
        min-height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .${this.cssPrefix}-widget.pwx-loading::after {
        content: '';
        width: 32px;
        height: 32px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid var(--pwx-primary-color, #007bff);
        border-radius: 50%;
        animation: pwx-spin 1s linear infinite;
      }

      @keyframes pwx-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .${this.cssPrefix}-widget.pwx-error {
        padding: 20px;
        text-align: center;
        color: #dc3545;
        background: #f8d7da;
        border-radius: var(--pwx-border-radius, 8px);
      }

      /* Product Card Base */
      .${this.cssPrefix}-product-card {
        background: #fff;
        border-radius: var(--pwx-border-radius, 8px);
        box-shadow: var(--pwx-shadow, 0 2px 8px rgba(0,0,0,0.1));
        overflow: hidden;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .${this.cssPrefix}-product-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      }

      .${this.cssPrefix}-product-image {
        width: 100%;
        aspect-ratio: 1;
        object-fit: cover;
        display: block;
      }

      .${this.cssPrefix}-product-content {
        padding: 12px;
      }

      .${this.cssPrefix}-product-title {
        font-size: 14px;
        font-weight: 500;
        color: #333;
        margin: 0 0 8px 0;
        line-height: 1.4;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .${this.cssPrefix}-product-price {
        font-size: 16px;
        font-weight: 600;
        color: var(--pwx-primary-color, #007bff);
      }

      .${this.cssPrefix}-product-old-price {
        font-size: 13px;
        color: #999;
        text-decoration: line-through;
        margin-left: 8px;
      }

      .${this.cssPrefix}-product-link {
        text-decoration: none;
        color: inherit;
        display: block;
      }

      .${this.cssPrefix}-product-link:hover {
        text-decoration: none;
      }

      /* Badge */
      .${this.cssPrefix}-badge {
        position: absolute;
        top: 8px;
        left: 8px;
        background: var(--pwx-primary-color, #007bff);
        color: #fff;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
      }

      .${this.cssPrefix}-badge--sale {
        background: #dc3545;
      }

      .${this.cssPrefix}-badge--new {
        background: #28a745;
      }
    `;
  }

  /**
   * Render the widget
   * Must be overridden by subclass
   *
   * @abstract
   * @returns {Promise<void>}
   */
  async render() {
    throw new Error('render() must be implemented by subclass');
  }

  /**
   * Bind event listeners
   * @protected
   */
  _bindEvents() {
    // Resize handler with debounce
    const handleResize = debounce(() => {
      this.onResize();
    }, 200);

    this._addListener(window, 'resize', handleResize);

    // Click delegation
    this._addListener(this.container, 'click', (e) => {
      this._handleClick(e);
    });
  }

  /**
   * Add event listener with cleanup tracking
   *
   * @param {EventTarget} target - Event target
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @param {Object} options - Event options
   */
  _addListener(target, event, handler, options = {}) {
    target.addEventListener(event, handler, options);
    this._listeners.push({ target, event, handler, options });
  }

  /**
   * Handle click events (delegation)
   *
   * @param {Event} event - Click event
   */
  _handleClick(event) {
    const target = event.target;

    // Find product card
    const productCard = target.closest('[data-product-id]');
    if (productCard) {
      const productId = productCard.dataset.productId;
      this._trackClick(productId);
      this.emit('product:click', { productId, product: this._findProduct(productId) });
    }
  }

  /**
   * Find product by ID
   *
   * @param {string} productId - Product ID
   * @returns {Object|null} Product object
   */
  _findProduct(productId) {
    return this.products.find(p => p.id === productId || p.externalId === productId);
  }

  /**
   * Track product click
   *
   * @param {string} productId - Product ID
   */
  _trackClick(productId) {
    if (!config.isAnalyticsEnabled()) return;

    const customerSlug = config.getCustomerSlug();
    if (customerSlug) {
      api.trackEvent(customerSlug, {
        type: 'click',
        widgetId: this.id,
        widgetType: this.type,
        productId
      });
    }
  }

  /**
   * Handle window resize
   * Override in subclass for responsive behavior
   */
  onResize() {
    // Override in subclass
  }

  /**
   * Update widget with new data
   *
   * @param {Object} data - New data
   * @returns {Promise<void>}
   */
  async update(data) {
    logger.debug(`Widget ${this.id} updating...`);

    this.data = data;
    this.products = data.products || [];

    // Re-render
    await this.render();

    this.emit('update', { id: this.id });

    logger.debug(`Widget ${this.id} updated`);
  }

  /**
   * Destroy the widget
   * Cleanup resources and remove from DOM
   */
  destroy() {
    if (this.state.destroyed) {
      return;
    }

    logger.debug(`Widget ${this.id} destroying...`);

    // Remove event listeners
    this._listeners.forEach(({ target, event, handler, options }) => {
      target.removeEventListener(event, handler, options);
    });
    this._listeners = [];

    // Clear container
    this.container.innerHTML = '';
    this.container.classList.remove(
      `${this.cssPrefix}-widget`,
      `${this.cssPrefix}-${this.type}`,
      'pwx-loading',
      'pwx-mounted',
      'pwx-error'
    );

    // Clear references
    this.elements = {};
    this.products = [];
    this.data = {};

    this.state.destroyed = true;
    this.emit('destroy', { id: this.id });

    logger.debug(`Widget ${this.id} destroyed`);
  }

  // ========================================
  // Helper Methods for Subclasses
  // ========================================

  /**
   * Create a product card element
   *
   * @param {Object} product - Product data
   * @param {Object} options - Card options
   * @returns {HTMLElement} Product card element
   */
  createProductCard(product, options = {}) {
    const {
      showImage = this.options.showImage,
      showTitle = this.options.showTitle,
      showPrice = this.options.showPrice,
      linkTarget = this.options.linkTarget,
      imageLoading = this.options.imageLoading
    } = options;

    const card = createElement('div', {
      className: `${this.cssPrefix}-product-card`,
      dataset: {
        productId: product.id || product.externalId
      }
    });

    // Link wrapper (support both 'link' and 'url' field names)
    const link = createElement('a', {
      className: `${this.cssPrefix}-product-link`,
      href: product.link || product.url || '#',
      target: linkTarget,
      rel: 'noopener noreferrer'
    });

    // Image (support both 'imageLink' and 'image' field names)
    const productImage = product.imageLink || product.image;
    if (showImage && productImage) {
      const imageContainer = createElement('div', {
        className: `${this.cssPrefix}-product-image-container`,
        style: { position: 'relative' }
      });

      const img = createElement('img', {
        className: `${this.cssPrefix}-product-image`,
        src: productImage,
        alt: escapeHtml(product.title || ''),
        loading: imageLoading
      });

      imageContainer.appendChild(img);

      // Badge
      if (product.salePrice && product.price) {
        const discount = Math.round((1 - product.salePrice / product.price) * 100);
        if (discount > 0) {
          const badge = createElement('span', {
            className: `${this.cssPrefix}-badge ${this.cssPrefix}-badge--sale`
          }, `%${discount}`);
          imageContainer.appendChild(badge);
        }
      }

      link.appendChild(imageContainer);
    }

    // Content
    const content = createElement('div', {
      className: `${this.cssPrefix}-product-content`
    });

    // Title
    if (showTitle && product.title) {
      const title = createElement('h3', {
        className: `${this.cssPrefix}-product-title`,
        title: product.title
      }, escapeHtml(product.title));
      content.appendChild(title);
    }

    // Price
    if (showPrice) {
      const priceContainer = createElement('div', {
        className: `${this.cssPrefix}-product-prices`
      });

      const currentPrice = product.salePrice || product.price;
      if (currentPrice) {
        const price = createElement('span', {
          className: `${this.cssPrefix}-product-price`
        }, this.formatPrice(currentPrice));
        priceContainer.appendChild(price);
      }

      // Old price
      if (product.salePrice && product.price && product.salePrice < product.price) {
        const oldPrice = createElement('span', {
          className: `${this.cssPrefix}-product-old-price`
        }, this.formatPrice(product.price));
        priceContainer.appendChild(oldPrice);
      }

      content.appendChild(priceContainer);
    }

    link.appendChild(content);
    card.appendChild(link);

    return card;
  }

  /**
   * Format price with currency
   *
   * @param {number} price - Price value
   * @returns {string} Formatted price
   */
  formatPrice(price) {
    return formatPrice(
      price,
      this.options.currency,
      this.options.locale
    );
  }

  /**
   * Create CSS class name with prefix
   *
   * @param {...string} names - Class name parts
   * @returns {string} Full class name
   */
  bem(...names) {
    return `${this.cssPrefix}-${this.type}__${names.join('-')}`;
  }

  /**
   * Create element helper
   *
   * @param {string} tag - HTML tag
   * @param {Object} attrs - Attributes
   * @param {Array|string} children - Children
   * @returns {HTMLElement}
   */
  el(tag, attrs = {}, children = []) {
    return createElement(tag, attrs, children);
  }

  /**
   * Log debug message
   *
   * @param {...any} args - Log arguments
   */
  log(...args) {
    logger.debug(`[${this.type}:${this.id}]`, ...args);
  }
}

export default BaseWidget;
export { BaseWidget };
