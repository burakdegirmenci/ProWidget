/**
 * Custom Widget
 * Template-based custom widget with HTML/CSS support
 *
 * @module widgets/custom
 */

import BaseWidget from './BaseWidget.js';
import { TemplateEngine } from '../core/template-engine.js';
import { createElement, logger, escapeHtml } from '../core/utils.js';

/**
 * DOMPurify-like sanitizer for client-side HTML
 * Removes potentially dangerous elements and attributes
 */
const sanitizeHtml = (html) => {
  // Create a temporary element
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Dangerous tags to remove completely
  const dangerousTags = [
    'script', 'iframe', 'object', 'embed', 'link', 'style',
    'meta', 'base', 'form', 'input', 'textarea', 'select', 'button'
  ];

  // Remove dangerous tags
  dangerousTags.forEach(tag => {
    const elements = temp.querySelectorAll(tag);
    elements.forEach(el => el.remove());
  });

  // Dangerous attributes to remove
  const dangerousAttrs = [
    'onclick', 'onerror', 'onload', 'onmouseover', 'onmouseout',
    'onmousedown', 'onmouseup', 'onfocus', 'onblur', 'onchange',
    'onsubmit', 'onreset', 'onkeydown', 'onkeyup', 'onkeypress',
    'ondblclick', 'oncontextmenu', 'ondrag', 'ondragstart', 'ondragend',
    'ondragenter', 'ondragleave', 'ondragover', 'ondrop'
  ];

  // Remove dangerous attributes from all elements
  const allElements = temp.querySelectorAll('*');
  allElements.forEach(el => {
    // Remove event handlers
    dangerousAttrs.forEach(attr => {
      el.removeAttribute(attr);
    });

    // Check for javascript: URLs
    ['href', 'src', 'action'].forEach(attr => {
      const value = el.getAttribute(attr);
      if (value && value.toLowerCase().trim().startsWith('javascript:')) {
        el.removeAttribute(attr);
      }
    });

    // Remove data: URLs for src (except images)
    const src = el.getAttribute('src');
    if (src && src.toLowerCase().trim().startsWith('data:') && el.tagName !== 'IMG') {
      el.removeAttribute('src');
    }
  });

  return temp.innerHTML;
};

/**
 * Allowed PWX actions for safe event binding
 */
const ALLOWED_ACTIONS = {
  /**
   * Navigate to URL
   */
  navigate: (payload, widget) => {
    if (payload.url) {
      const target = payload.target || '_blank';
      window.open(payload.url, target, 'noopener,noreferrer');
      widget._trackAction('navigate', payload);
    }
  },

  /**
   * Add to cart (post message to parent)
   */
  addToCart: (payload, widget) => {
    window.postMessage({
      type: 'pwx:addToCart',
      productId: payload.productId,
      quantity: payload.quantity || 1,
      widgetId: widget.id
    }, '*');
    widget._trackAction('addToCart', payload);
  },

  /**
   * Track click event
   */
  trackClick: (payload, widget) => {
    widget._trackAction('click', payload);
  },

  /**
   * Toggle element visibility
   */
  toggle: (payload, widget) => {
    const target = widget.shadowRoot?.querySelector(payload.selector) ||
                   widget.container.querySelector(payload.selector);
    if (target) {
      target.classList.toggle(payload.class || 'hidden');
    }
  },

  /**
   * Copy text to clipboard
   */
  copyText: async (payload, widget) => {
    try {
      await navigator.clipboard.writeText(payload.text);
      widget._trackAction('copyText', payload);

      // Show feedback if element specified
      if (payload.feedbackSelector) {
        const feedback = widget.shadowRoot?.querySelector(payload.feedbackSelector) ||
                        widget.container.querySelector(payload.feedbackSelector);
        if (feedback) {
          feedback.classList.add('visible');
          setTimeout(() => feedback.classList.remove('visible'), 2000);
        }
      }
    } catch (err) {
      logger.error('Copy to clipboard failed:', err);
    }
  },

  /**
   * Scroll to element
   */
  scrollTo: (payload, widget) => {
    const target = payload.selector ? document.querySelector(payload.selector) : null;
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: payload.block || 'start' });
    }
  },

  /**
   * Emit custom event
   */
  emit: (payload, widget) => {
    widget.emit(payload.event || 'custom:action', payload.data || {});
  }
};

/**
 * Custom Widget Class
 * Renders user-defined HTML/CSS templates with data
 */
class CustomWidget extends BaseWidget {
  /**
   * Widget type identifier
   */
  static type = 'custom';

  /**
   * Default options
   */
  static defaultOptions = {
    ...BaseWidget.defaultOptions,
    // Use Shadow DOM for CSS isolation
    useShadowDom: true,
    // Sanitize HTML output
    sanitize: true,
    // Additional CSS to inject
    additionalCss: '',
    // Template engine options
    escapeHtml: true
  };

  /**
   * Constructor
   */
  constructor(params) {
    super(params);

    /**
     * Custom template configuration
     * @type {Object}
     */
    this.template = this._parseJsonConfig(params.config, 'template');

    /**
     * Custom data from widget config
     * @type {Object}
     */
    this.customData = this._parseJsonConfig(params.config, 'customData') || {};

    /**
     * Shadow root reference
     * @type {ShadowRoot|null}
     */
    this.shadowRoot = null;

    /**
     * Template engine instance
     * @type {TemplateEngine|null}
     */
    this.engine = null;
  }

  /**
   * Parse JSON config from data attributes
   * Handles both direct object and JSON string formats
   *
   * @param {Object} config - Config object
   * @param {string} key - Key to parse
   * @returns {Object|null} Parsed config
   */
  _parseJsonConfig(config, key) {
    if (!config) return null;

    // Check direct key first
    if (config[key] && typeof config[key] === 'object') {
      return config[key];
    }

    // Check data attribute format (e.g., 'template' from 'data-pwx-template')
    const dataAttrValue = config[key];
    if (dataAttrValue && typeof dataAttrValue === 'string') {
      try {
        return JSON.parse(dataAttrValue);
      } catch (e) {
        logger.warn(`Failed to parse ${key} config:`, e);
        return null;
      }
    }

    return null;
  }

  /**
   * Get widget styles (base styles for custom widgets)
   */
  getStyles() {
    return `
      ${super.getStyles()}

      /* Custom Widget Base Styles */
      .${this.cssPrefix}-custom {
        position: relative;
      }

      .${this.cssPrefix}-custom-content {
        width: 100%;
      }

      /* Shadow DOM host styles */
      :host {
        display: block;
        width: 100%;
      }

      /* Hidden utility class */
      .hidden {
        display: none !important;
      }

      /* Countdown styles */
      .pwx-countdown {
        font-variant-numeric: tabular-nums;
      }

      /* Copy feedback */
      .pwx-copy-feedback {
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .pwx-copy-feedback.visible {
        opacity: 1;
      }
    `;
  }

  /**
   * Render the custom widget
   */
  async render() {
    if (!this.template) {
      logger.warn(`CustomWidget ${this.id}: No template provided`);
      this.container.innerHTML = `
        <div class="${this.cssPrefix}-error">
          No template configured for this widget
        </div>
      `;
      return;
    }

    try {
      // Create template engine
      this.engine = new TemplateEngine(this.template.htmlTemplate || '', {
        escapeHtml: this.options.escapeHtml,
        helpers: this._getCustomHelpers()
      });

      // Prepare render context
      const context = this._buildRenderContext();

      // Render template
      let renderedHtml = this.engine.render(context);

      // Sanitize output if enabled
      if (this.options.sanitize) {
        renderedHtml = sanitizeHtml(renderedHtml);
      }

      // Get CSS
      const css = this._buildCss();

      // Render using Shadow DOM or regular DOM
      if (this.options.useShadowDom && this.container.attachShadow) {
        this._renderWithShadowDom(renderedHtml, css);
      } else {
        this._renderWithoutShadowDom(renderedHtml, css);
      }

      // Bind safe events
      this._bindSafeEvents();

      // Initialize countdown timers if any
      this._initCountdowns();

      this.state.rendered = true;
      this.emit('render', { id: this.id });

    } catch (error) {
      logger.error(`CustomWidget ${this.id} render error:`, error);
      this.container.innerHTML = `
        <div class="${this.cssPrefix}-error">
          Widget render error: ${escapeHtml(error.message)}
        </div>
      `;
      this.emit('error', error);
    }
  }

  /**
   * Build render context with all available data
   */
  _buildRenderContext() {
    // Get default data from template if available
    const defaultData = this.template.defaultData || {};

    return {
      // Products from feed
      products: this.products,

      // Custom data (widget-specific)
      ...defaultData,
      ...this.customData,

      // Theme
      theme: this.theme,

      // Widget metadata
      _meta: {
        widgetId: this.id,
        widgetType: this.type,
        currentDate: new Date().toISOString(),
        productCount: this.products.length
      }
    };
  }

  /**
   * Get custom template helpers
   */
  _getCustomHelpers() {
    return {
      // Live countdown (returns placeholder that will be updated)
      liveCountdown: (targetDate, format) => {
        const id = `countdown-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        return `<span class="pwx-countdown" data-pwx-countdown="${targetDate}" id="${id}"></span>`;
      },

      // Safe JSON for data attributes
      safeJson: (obj) => {
        try {
          return escapeHtml(JSON.stringify(obj));
        } catch {
          return '{}';
        }
      },

      // Product image with fallback
      productImage: (product, fallback = '') => {
        return product?.imageLink || product?.image || fallback;
      },

      // Product URL
      productUrl: (product) => {
        return product?.link || product?.url || '#';
      }
    };
  }

  /**
   * Build CSS from template and options
   */
  _buildCss() {
    const parts = [];

    // Base styles
    parts.push(this.getStyles());

    // Template CSS
    if (this.template.cssStyles) {
      parts.push(this.template.cssStyles);
    }

    // Additional CSS from options
    if (this.options.additionalCss) {
      parts.push(this.options.additionalCss);
    }

    // Theme CSS variables
    parts.push(this._getThemeCssVars());

    return parts.join('\n');
  }

  /**
   * Get theme as CSS variables
   */
  _getThemeCssVars() {
    const vars = [];

    if (this.theme.primaryColor) {
      vars.push(`--pwx-primary-color: ${this.theme.primaryColor};`);
    }
    if (this.theme.secondaryColor) {
      vars.push(`--pwx-secondary-color: ${this.theme.secondaryColor};`);
    }
    if (this.theme.fontFamily) {
      vars.push(`--pwx-font-family: ${this.theme.fontFamily};`);
    }
    if (this.theme.borderRadius) {
      vars.push(`--pwx-border-radius: ${this.theme.borderRadius};`);
    }
    if (this.theme.shadow) {
      vars.push(`--pwx-shadow: ${this.theme.shadow};`);
    }

    return `:host, .${this.cssPrefix}-custom { ${vars.join(' ')} }`;
  }

  /**
   * Render with Shadow DOM (CSS isolation)
   */
  _renderWithShadowDom(html, css) {
    // Create shadow root if not exists
    if (!this.shadowRoot) {
      this.shadowRoot = this.container.attachShadow({ mode: 'open' });
    }

    this.shadowRoot.innerHTML = `
      <style>${css}</style>
      <div class="${this.cssPrefix}-custom-content">
        ${html}
      </div>
    `;
  }

  /**
   * Render without Shadow DOM (fallback)
   */
  _renderWithoutShadowDom(html, css) {
    // Inject styles
    const styleId = `${this.cssPrefix}-custom-${this.id}-styles`;
    let styleEl = document.getElementById(styleId);

    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = css;

    // Render content
    this.container.innerHTML = `
      <div class="${this.cssPrefix}-custom-content">
        ${html}
      </div>
    `;
  }

  /**
   * Bind safe event handlers via data attributes
   */
  _bindSafeEvents() {
    const root = this.shadowRoot || this.container;

    // Find all elements with data-pwx-action
    const actionElements = root.querySelectorAll('[data-pwx-action]');

    actionElements.forEach(el => {
      const action = el.dataset.pwxAction;
      let payload = {};

      // Parse payload from data attribute
      try {
        const payloadStr = el.dataset.pwxPayload;
        if (payloadStr) {
          payload = JSON.parse(payloadStr);
        }
      } catch (e) {
        logger.warn('Invalid action payload:', e);
      }

      // Bind click handler
      el.addEventListener('click', (e) => {
        e.preventDefault();
        this._executeAction(action, payload);
      });
    });
  }

  /**
   * Execute a safe action
   */
  _executeAction(action, payload) {
    if (!ALLOWED_ACTIONS[action]) {
      logger.warn(`Unknown action: ${action}`);
      return;
    }

    try {
      ALLOWED_ACTIONS[action](payload, this);
    } catch (error) {
      logger.error(`Action "${action}" failed:`, error);
    }
  }

  /**
   * Track action for analytics
   */
  _trackAction(action, payload) {
    this.emit('action', { action, payload, widgetId: this.id });

    // Could also call API for tracking
    // api.trackEvent(...)
  }

  /**
   * Initialize live countdown elements
   */
  _initCountdowns() {
    const root = this.shadowRoot || this.container;
    const countdowns = root.querySelectorAll('[data-pwx-countdown]');

    countdowns.forEach(el => {
      const targetDate = el.dataset.pwxCountdown;
      if (!targetDate) return;

      const updateCountdown = () => {
        const target = new Date(targetDate);
        const now = new Date();
        const diff = target - now;

        if (diff <= 0) {
          el.textContent = 'Ended';
          return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        parts.push(`${String(hours).padStart(2, '0')}h`);
        parts.push(`${String(minutes).padStart(2, '0')}m`);
        parts.push(`${String(seconds).padStart(2, '0')}s`);

        el.textContent = parts.join(' ');
      };

      // Initial update
      updateCountdown();

      // Update every second
      const interval = setInterval(updateCountdown, 1000);

      // Store interval for cleanup
      if (!this._countdownIntervals) {
        this._countdownIntervals = [];
      }
      this._countdownIntervals.push(interval);
    });
  }

  /**
   * Update widget with new template or data
   */
  async update(data) {
    // Update template if provided
    if (data.template) {
      this.template = data.template;
    }

    // Update custom data if provided
    if (data.customData) {
      this.customData = { ...this.customData, ...data.customData };
    }

    // Update products
    if (data.products) {
      this.products = data.products;
    }

    // Re-render
    await this.render();

    this.emit('update', { id: this.id });
  }

  /**
   * Destroy widget and cleanup
   */
  destroy() {
    // Clear countdown intervals
    if (this._countdownIntervals) {
      this._countdownIntervals.forEach(interval => clearInterval(interval));
      this._countdownIntervals = [];
    }

    // Remove injected styles (if not using shadow DOM)
    if (!this.options.useShadowDom) {
      const styleId = `${this.cssPrefix}-custom-${this.id}-styles`;
      const styleEl = document.getElementById(styleId);
      if (styleEl) {
        styleEl.remove();
      }
    }

    // Clear shadow root
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = '';
    }

    // Call parent destroy
    super.destroy();
  }
}

export default CustomWidget;
export { CustomWidget, ALLOWED_ACTIONS, sanitizeHtml };
