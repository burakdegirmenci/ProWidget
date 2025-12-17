/**
 * Storage Manager
 * localStorage wrapper with namespace and expiry support
 *
 * @module core/storage
 */

import { logger } from './utils.js';

/**
 * Storage keys
 */
export const STORAGE_KEYS = {
  JOURNEY: 'JOURNEY',           // Son goruntulenen urunler
  SEARCH_HISTORY: 'SEARCH',     // Arama gecmisi
  AB_GROUP: 'AB',               // A/B test grubu
  USER: 'USER'                  // Kullanici bilgisi
};

/**
 * Check if localStorage is available
 * @returns {boolean}
 */
const isStorageAvailable = () => {
  try {
    const test = '__pwx_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * StorageManager Class
 * Provides namespaced localStorage access with expiry support
 */
class StorageManager {
  /**
   * @param {string} namespace - Storage key prefix
   */
  constructor(namespace = 'PWX') {
    this.namespace = namespace;
    this.available = isStorageAvailable();

    if (!this.available) {
      logger.warn('localStorage not available, using in-memory fallback');
      this._memoryStore = {};
    }
  }

  /**
   * Build namespaced key
   * @param {string} key - Base key
   * @returns {string} Namespaced key
   */
  _buildKey(key) {
    return `${this.namespace}-${key}`;
  }

  /**
   * Get value from storage
   * @param {string} key - Storage key
   * @returns {any} Parsed value or null
   */
  get(key) {
    const fullKey = this._buildKey(key);

    try {
      let raw;

      if (this.available) {
        raw = localStorage.getItem(fullKey);
      } else {
        raw = this._memoryStore[fullKey];
      }

      if (!raw) return null;

      const data = JSON.parse(raw);

      // Check expiry
      if (data._expiry && Date.now() > data._expiry) {
        this.remove(key);
        return null;
      }

      return data.value;
    } catch (e) {
      logger.warn(`Storage get error for ${key}:`, e);
      return null;
    }
  }

  /**
   * Set value in storage
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   * @param {number} expireDays - Optional expiry in days
   */
  set(key, value, expireDays = null) {
    const fullKey = this._buildKey(key);

    try {
      const data = {
        value,
        _timestamp: Date.now()
      };

      if (expireDays) {
        data._expiry = Date.now() + (expireDays * 24 * 60 * 60 * 1000);
      }

      const raw = JSON.stringify(data);

      if (this.available) {
        localStorage.setItem(fullKey, raw);
      } else {
        this._memoryStore[fullKey] = raw;
      }
    } catch (e) {
      // Handle quota exceeded
      if (e.name === 'QuotaExceededError') {
        logger.warn('Storage quota exceeded, clearing old data');
        this._clearOldest();
        // Retry once
        try {
          localStorage.setItem(fullKey, JSON.stringify({ value, _timestamp: Date.now() }));
        } catch (e2) {
          logger.error('Storage set failed after cleanup:', e2);
        }
      } else {
        logger.warn(`Storage set error for ${key}:`, e);
      }
    }
  }

  /**
   * Remove value from storage
   * @param {string} key - Storage key
   */
  remove(key) {
    const fullKey = this._buildKey(key);

    try {
      if (this.available) {
        localStorage.removeItem(fullKey);
      } else {
        delete this._memoryStore[fullKey];
      }
    } catch (e) {
      logger.warn(`Storage remove error for ${key}:`, e);
    }
  }

  /**
   * Clear all namespaced keys
   */
  clear() {
    try {
      if (this.available) {
        const keysToRemove = [];

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`${this.namespace}-`)) {
            keysToRemove.push(key);
          }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));
      } else {
        this._memoryStore = {};
      }
    } catch (e) {
      logger.warn('Storage clear error:', e);
    }
  }

  /**
   * Get all keys in namespace
   * @returns {string[]} Array of keys
   */
  keys() {
    const result = [];
    const prefix = `${this.namespace}-`;

    try {
      if (this.available) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(prefix)) {
            result.push(key.substring(prefix.length));
          }
        }
      } else {
        Object.keys(this._memoryStore).forEach(key => {
          if (key.startsWith(prefix)) {
            result.push(key.substring(prefix.length));
          }
        });
      }
    } catch (e) {
      logger.warn('Storage keys error:', e);
    }

    return result;
  }

  /**
   * Clear oldest items when quota exceeded
   * @private
   */
  _clearOldest() {
    try {
      const items = [];
      const prefix = `${this.namespace}-`;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            items.push({
              key,
              timestamp: data._timestamp || 0
            });
          } catch (e) {
            // Invalid JSON, remove it
            localStorage.removeItem(key);
          }
        }
      }

      // Sort by timestamp (oldest first) and remove oldest 20%
      items.sort((a, b) => a.timestamp - b.timestamp);
      const removeCount = Math.max(1, Math.floor(items.length * 0.2));

      for (let i = 0; i < removeCount; i++) {
        localStorage.removeItem(items[i].key);
      }
    } catch (e) {
      logger.warn('Storage cleanup error:', e);
    }
  }

  /**
   * Check if storage is available
   * @returns {boolean}
   */
  isAvailable() {
    return this.available;
  }

  /**
   * Get storage usage stats
   * @returns {Object} Usage statistics
   */
  getStats() {
    const stats = {
      available: this.available,
      keyCount: 0,
      approximateSize: 0
    };

    try {
      if (this.available) {
        const prefix = `${this.namespace}-`;

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(prefix)) {
            stats.keyCount++;
            const value = localStorage.getItem(key);
            if (value) {
              stats.approximateSize += key.length + value.length;
            }
          }
        }

        // Convert to KB
        stats.approximateSize = Math.round(stats.approximateSize / 1024 * 100) / 100;
      }
    } catch (e) {
      logger.warn('Storage stats error:', e);
    }

    return stats;
  }
}

// Create singleton instance
const storage = new StorageManager();

export { StorageManager, storage };
export default storage;
