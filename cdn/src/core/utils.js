/**
 * Utility Functions
 * DOM helpers, logging, and common utilities
 *
 * @module core/utils
 */

/**
 * Log levels
 * @enum {number}
 */
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
};

/**
 * Current log level (can be configured via PWX.config)
 * @type {number}
 */
let currentLogLevel = LOG_LEVELS.WARN;

/**
 * Logger utility with configurable levels
 */
const logger = {
  /**
   * Set log level
   * @param {string} level - Log level name
   */
  setLevel(level) {
    const upperLevel = String(level).toUpperCase();
    if (LOG_LEVELS[upperLevel] !== undefined) {
      currentLogLevel = LOG_LEVELS[upperLevel];
    }
  },

  /**
   * Format log message with prefix
   * @param {string} level - Log level
   * @param {Array} args - Arguments to log
   * @returns {Array} Formatted arguments
   */
  _format(level, args) {
    const timestamp = new Date().toISOString().substr(11, 8);
    return [`[PWX ${timestamp}] [${level}]`, ...args];
  },

  /**
   * Debug log
   * @param {...any} args - Arguments to log
   */
  debug(...args) {
    if (currentLogLevel <= LOG_LEVELS.DEBUG) {
      console.debug(...this._format('DEBUG', args));
    }
  },

  /**
   * Info log
   * @param {...any} args - Arguments to log
   */
  info(...args) {
    if (currentLogLevel <= LOG_LEVELS.INFO) {
      console.info(...this._format('INFO', args));
    }
  },

  /**
   * Warning log
   * @param {...any} args - Arguments to log
   */
  warn(...args) {
    if (currentLogLevel <= LOG_LEVELS.WARN) {
      console.warn(...this._format('WARN', args));
    }
  },

  /**
   * Error log
   * @param {...any} args - Arguments to log
   */
  error(...args) {
    if (currentLogLevel <= LOG_LEVELS.ERROR) {
      console.error(...this._format('ERROR', args));
    }
  }
};

/**
 * DOM Ready helper
 * Executes callback when DOM is ready
 *
 * @param {Function} callback - Function to execute when DOM is ready
 */
function domReady(callback) {
  if (typeof callback !== 'function') {
    return;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback, { once: true });
  } else {
    // DOM already loaded, execute immediately
    callback();
  }
}

/**
 * Parse data attributes from element
 * Converts data-pwx-* attributes to configuration object
 *
 * @param {HTMLElement} element - DOM element
 * @param {string} prefix - Attribute prefix (default: 'pwx')
 * @returns {Object} Parsed configuration object
 */
function parseDataAttributes(element, prefix = 'pwx') {
  if (!element || !element.dataset) {
    return {};
  }

  const config = {};
  const prefixLength = prefix.length;

  // Iterate through all data attributes
  Object.keys(element.dataset).forEach(key => {
    // Check if key starts with prefix
    if (key.toLowerCase().startsWith(prefix.toLowerCase())) {
      // Remove prefix and convert to camelCase
      let configKey = key.slice(prefixLength);

      // Handle the case where prefix is immediately followed by uppercase
      if (configKey.length > 0) {
        configKey = configKey.charAt(0).toLowerCase() + configKey.slice(1);
      }

      // Parse value (handle JSON, booleans, numbers)
      config[configKey] = parseAttributeValue(element.dataset[key]);
    }
  });

  return config;
}

/**
 * Parse attribute value to appropriate type
 *
 * @param {string} value - Raw attribute value
 * @returns {any} Parsed value
 */
function parseAttributeValue(value) {
  if (value === undefined || value === null) {
    return value;
  }

  const trimmed = String(value).trim();

  // Handle empty string
  if (trimmed === '') {
    return '';
  }

  // Handle boolean
  if (trimmed.toLowerCase() === 'true') {
    return true;
  }
  if (trimmed.toLowerCase() === 'false') {
    return false;
  }

  // Handle number
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    const num = parseFloat(trimmed);
    if (!isNaN(num)) {
      return num;
    }
  }

  // Handle JSON (arrays and objects)
  if ((trimmed.startsWith('[') && trimmed.endsWith(']')) ||
      (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
    try {
      return JSON.parse(trimmed);
    } catch (e) {
      // Not valid JSON, return as string
      logger.debug('Failed to parse JSON attribute:', trimmed);
    }
  }

  // Return as string
  return trimmed;
}

/**
 * Query selector helper with error handling
 *
 * @param {string} selector - CSS selector
 * @param {HTMLElement|Document} context - Context element
 * @returns {HTMLElement|null} Found element or null
 */
function $(selector, context = document) {
  try {
    return context.querySelector(selector);
  } catch (e) {
    logger.error('Invalid selector:', selector);
    return null;
  }
}

/**
 * Query selector all helper
 *
 * @param {string} selector - CSS selector
 * @param {HTMLElement|Document} context - Context element
 * @returns {Array<HTMLElement>} Array of found elements
 */
function $$(selector, context = document) {
  try {
    return Array.from(context.querySelectorAll(selector));
  } catch (e) {
    logger.error('Invalid selector:', selector);
    return [];
  }
}

/**
 * Create DOM element with attributes
 *
 * @param {string} tag - HTML tag name
 * @param {Object} attributes - Element attributes
 * @param {Array|string} children - Child elements or text content
 * @returns {HTMLElement} Created element
 */
function createElement(tag, attributes = {}, children = []) {
  const element = document.createElement(tag);

  // Set attributes
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.slice(2).toLowerCase();
      element.addEventListener(eventName, value);
    } else if (key === 'dataset' && typeof value === 'object') {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        element.dataset[dataKey] = dataValue;
      });
    } else if (value !== null && value !== undefined) {
      element.setAttribute(key, value);
    }
  });

  // Add children
  const childArray = Array.isArray(children) ? children : [children];
  childArray.forEach(child => {
    if (child instanceof HTMLElement) {
      element.appendChild(child);
    } else if (child !== null && child !== undefined) {
      element.appendChild(document.createTextNode(String(child)));
    }
  });

  return element;
}

/**
 * Add CSS styles to document
 *
 * @param {string} css - CSS string
 * @param {string} id - Style element ID
 * @returns {HTMLStyleElement} Created style element
 */
function addStyles(css, id = 'pwx-styles') {
  // Check if style already exists
  let styleEl = document.getElementById(id);

  if (!styleEl) {
    styleEl = createElement('style', { id, type: 'text/css' });
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = css;
  return styleEl;
}

/**
 * Debounce function calls
 *
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 100) {
  let timeoutId = null;

  return function debounced(...args) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args);
      timeoutId = null;
    }, wait);
  };
}

/**
 * Throttle function calls
 *
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in ms
 * @returns {Function} Throttled function
 */
function throttle(func, limit = 100) {
  let inThrottle = false;

  return function throttled(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Deep merge objects
 *
 * @param {Object} target - Target object
 * @param {...Object} sources - Source objects
 * @returns {Object} Merged object
 */
function deepMerge(target, ...sources) {
  if (!sources.length) return target;

  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!target[key]) {
          Object.assign(target, { [key]: {} });
        }
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    });
  }

  return deepMerge(target, ...sources);
}

/**
 * Check if value is plain object
 *
 * @param {any} item - Value to check
 * @returns {boolean} True if plain object
 */
function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Generate unique ID
 *
 * @param {string} prefix - ID prefix
 * @returns {string} Unique ID
 */
function generateId(prefix = 'pwx') {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Escape HTML special characters
 *
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  if (typeof str !== 'string') {
    return str;
  }

  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };

  return str.replace(/[&<>"'/]/g, char => escapeMap[char]);
}

/**
 * Format price with currency
 *
 * @param {number} price - Price value
 * @param {string} currency - Currency code
 * @param {string} locale - Locale for formatting
 * @returns {string} Formatted price
 */
function formatPrice(price, currency = 'TRY', locale = 'tr-TR') {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(price);
  } catch (e) {
    logger.warn('Price formatting failed:', e.message);
    return `${price} ${currency}`;
  }
}

/**
 * Check if element is in viewport
 *
 * @param {HTMLElement} element - Element to check
 * @param {number} threshold - Visibility threshold (0-1)
 * @returns {boolean} True if visible
 */
function isInViewport(element, threshold = 0) {
  if (!element) return false;

  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;

  const vertInView = (rect.top <= windowHeight) && ((rect.top + rect.height) >= 0);
  const horInView = (rect.left <= windowWidth) && ((rect.left + rect.width) >= 0);

  if (threshold > 0) {
    const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
    const visibleWidth = Math.min(rect.right, windowWidth) - Math.max(rect.left, 0);
    const visibleArea = visibleHeight * visibleWidth;
    const totalArea = rect.height * rect.width;

    return (visibleArea / totalArea) >= threshold;
  }

  return vertInView && horInView;
}

/**
 * Load external script
 *
 * @param {string} src - Script URL
 * @param {Object} options - Script options
 * @returns {Promise<HTMLScriptElement>} Loaded script element
 */
function loadScript(src, options = {}) {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve(null);
      return;
    }

    const script = createElement('script', {
      src,
      async: options.async !== false,
      defer: options.defer || false
    });

    script.onload = () => resolve(script);
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));

    document.head.appendChild(script);
  });
}

/**
 * Local storage helper with JSON support
 */
const storage = {
  /**
   * Get item from storage
   * @param {string} key - Storage key
   * @param {any} defaultValue - Default value if not found
   * @returns {any} Stored value
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(`pwx_${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      logger.warn('Storage get failed:', e.message);
      return defaultValue;
    }
  },

  /**
   * Set item in storage
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   */
  set(key, value) {
    try {
      localStorage.setItem(`pwx_${key}`, JSON.stringify(value));
    } catch (e) {
      logger.warn('Storage set failed:', e.message);
    }
  },

  /**
   * Remove item from storage
   * @param {string} key - Storage key
   */
  remove(key) {
    try {
      localStorage.removeItem(`pwx_${key}`);
    } catch (e) {
      logger.warn('Storage remove failed:', e.message);
    }
  }
};

/**
 * Event emitter for pub/sub pattern
 */
class EventEmitter {
  constructor() {
    this._events = {};
  }

  /**
   * Subscribe to event
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this._events[event]) {
      this._events[event] = [];
    }
    this._events[event].push(callback);

    return () => this.off(event, callback);
  }

  /**
   * Subscribe to event once
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   */
  once(event, callback) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      callback.apply(this, args);
    };
    this.on(event, wrapper);
  }

  /**
   * Unsubscribe from event
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   */
  off(event, callback) {
    if (!this._events[event]) return;

    this._events[event] = this._events[event].filter(cb => cb !== callback);
  }

  /**
   * Emit event
   * @param {string} event - Event name
   * @param {...any} args - Event arguments
   */
  emit(event, ...args) {
    if (!this._events[event]) return;

    this._events[event].forEach(callback => {
      try {
        callback.apply(this, args);
      } catch (e) {
        logger.error(`Event handler error for ${event}:`, e);
      }
    });
  }
}

export {
  LOG_LEVELS,
  logger,
  domReady,
  parseDataAttributes,
  parseAttributeValue,
  $,
  $$,
  createElement,
  addStyles,
  debounce,
  throttle,
  deepMerge,
  isObject,
  generateId,
  escapeHtml,
  formatPrice,
  isInViewport,
  loadScript,
  storage,
  EventEmitter
};
