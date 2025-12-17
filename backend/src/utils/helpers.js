/**
 * Helper Utilities
 * Common utility functions used across the application
 *
 * @module utils/helpers
 */

const { PAGINATION, SLUG_PATTERN } = require('../config/constants');

/**
 * Pagination utilities
 */
const pagination = {
  /**
   * Parse pagination parameters from request query
   *
   * @param {Object} query - Express request query object
   * @returns {Object} Parsed pagination parameters
   */
  parse(query) {
    const page = Math.max(1, parseInt(query.page, 10) || PAGINATION.DEFAULT_PAGE);
    const limit = Math.min(
      PAGINATION.MAX_LIMIT,
      Math.max(1, parseInt(query.limit, 10) || PAGINATION.DEFAULT_LIMIT)
    );
    const skip = (page - 1) * limit;

    return { page, limit, skip };
  },

  /**
   * Build pagination metadata
   *
   * @param {number} total - Total number of items
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @returns {Object} Pagination metadata
   */
  buildMeta(total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    return {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };
  }
};

/**
 * String utilities
 */
const string = {
  /**
   * Generate slug from string
   *
   * @param {string} text - Input text
   * @returns {string} URL-safe slug
   */
  slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  },

  /**
   * Validate slug format
   *
   * @param {string} slug - Slug to validate
   * @returns {boolean} True if valid
   */
  isValidSlug(slug) {
    return SLUG_PATTERN.test(slug);
  },

  /**
   * Truncate string with ellipsis
   *
   * @param {string} text - Input text
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated string
   */
  truncate(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
  },

  /**
   * Capitalize first letter
   *
   * @param {string} text - Input text
   * @returns {string} Capitalized string
   */
  capitalize(text) {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },

  /**
   * Convert to title case
   *
   * @param {string} text - Input text
   * @returns {string} Title case string
   */
  titleCase(text) {
    if (!text) return text;
    return text
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
};

/**
 * Object utilities
 */
const object = {
  /**
   * Remove undefined and null values from object
   *
   * @param {Object} obj - Input object
   * @returns {Object} Cleaned object
   */
  removeEmpty(obj) {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, value]) => value != null)
    );
  },

  /**
   * Pick specific keys from object
   *
   * @param {Object} obj - Input object
   * @param {string[]} keys - Keys to pick
   * @returns {Object} Object with only specified keys
   */
  pick(obj, keys) {
    return keys.reduce((result, key) => {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = obj[key];
      }
      return result;
    }, {});
  },

  /**
   * Omit specific keys from object
   *
   * @param {Object} obj - Input object
   * @param {string[]} keys - Keys to omit
   * @returns {Object} Object without specified keys
   */
  omit(obj, keys) {
    return Object.fromEntries(
      Object.entries(obj).filter(([key]) => !keys.includes(key))
    );
  },

  /**
   * Deep merge objects
   *
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   * @returns {Object} Merged object
   */
  deepMerge(target, source) {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach((key) => {
        if (isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = object.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }
};

/**
 * Check if value is plain object
 *
 * @param {*} item - Value to check
 * @returns {boolean} True if plain object
 */
function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Array utilities
 */
const array = {
  /**
   * Remove duplicates from array
   *
   * @param {Array} arr - Input array
   * @param {string} key - Key for object arrays (optional)
   * @returns {Array} Array without duplicates
   */
  unique(arr, key = null) {
    if (key) {
      const seen = new Set();
      return arr.filter((item) => {
        const value = item[key];
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
      });
    }
    return [...new Set(arr)];
  },

  /**
   * Chunk array into smaller arrays
   *
   * @param {Array} arr - Input array
   * @param {number} size - Chunk size
   * @returns {Array} Array of chunks
   */
  chunk(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  },

  /**
   * Group array by key
   *
   * @param {Array} arr - Input array
   * @param {string} key - Grouping key
   * @returns {Object} Grouped object
   */
  groupBy(arr, key) {
    return arr.reduce((result, item) => {
      const groupKey = item[key];
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    }, {});
  }
};

/**
 * Date utilities
 */
const date = {
  /**
   * Format date to ISO string
   *
   * @param {Date|string} dateInput - Date to format
   * @returns {string} ISO date string
   */
  toISO(dateInput) {
    return new Date(dateInput).toISOString();
  },

  /**
   * Add time to date
   *
   * @param {Date} dateInput - Input date
   * @param {number} amount - Amount to add
   * @param {string} unit - Time unit (minutes, hours, days)
   * @returns {Date} New date
   */
  add(dateInput, amount, unit = 'minutes') {
    const date = new Date(dateInput);
    const multipliers = {
      minutes: 60 * 1000,
      hours: 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000
    };
    return new Date(date.getTime() + amount * multipliers[unit]);
  },

  /**
   * Check if date is expired
   *
   * @param {Date|string} dateInput - Date to check
   * @returns {boolean} True if expired
   */
  isExpired(dateInput) {
    return new Date(dateInput) < new Date();
  }
};

/**
 * Async utilities
 */
const async = {
  /**
   * Sleep for specified milliseconds
   *
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  /**
   * Retry function with exponential backoff
   *
   * @param {Function} fn - Function to retry
   * @param {number} maxRetries - Maximum retries
   * @param {number} baseDelay - Base delay in ms
   * @returns {Promise<*>} Function result
   */
  async retry(fn, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) {
          await this.sleep(baseDelay * Math.pow(2, i));
        }
      }
    }
    throw lastError;
  }
};

module.exports = {
  pagination,
  string,
  object,
  array,
  date,
  async,
  isObject
};
