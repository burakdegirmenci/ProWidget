/**
 * A/B Testing Manager
 * Simple client-side A/B testing with persistent group assignment
 *
 * @module core/ab-testing
 */

import { logger } from './utils.js';
import { storage, STORAGE_KEYS } from './storage.js';

/**
 * ABTestManager Class
 * Manages A/B test group assignments and variant selection
 */
class ABTestManager {
  /**
   * @param {StorageManager} storageManager - Storage instance
   * @param {Object} config - Configuration options
   */
  constructor(storageManager, config = {}) {
    this.storage = storageManager;
    this.defaultSplit = config.defaultSplit || 0.5;
    this.enabled = config.enabled !== false;

    // Active tests cache
    this._activeTests = new Map();
  }

  /**
   * Get user's group for a test
   * Assigns group if not already assigned
   * @param {string} testId - Test identifier
   * @param {number} split - Traffic split (0-1, proportion for group A)
   * @returns {string} 'A' or 'B'
   */
  getGroup(testId = 'default', split = null) {
    if (!this.enabled) {
      return 'A'; // Default to control group when disabled
    }

    const key = `${STORAGE_KEYS.AB_GROUP}_${testId}`;

    try {
      let group = this.storage.get(key);

      if (!group) {
        // Assign new group based on split ratio
        const ratio = split !== null ? split : this.defaultSplit;
        group = Math.random() < ratio ? 'A' : 'B';

        // Store for 30 days
        this.storage.set(key, group, 30);

        logger.debug(`A/B Test "${testId}": Assigned to group ${group}`);

        // Track assignment event
        this._trackEvent(testId, 'assignment', { group });
      }

      return group;
    } catch (e) {
      logger.warn(`A/B test group error for ${testId}:`, e);
      return 'A';
    }
  }

  /**
   * Get variant configuration for a test
   * @param {string} testId - Test identifier
   * @param {Object} variants - Variant configurations { A: {...}, B: {...} }
   * @param {number} split - Traffic split
   * @returns {any} Selected variant configuration
   */
  getVariant(testId, variants, split = null) {
    if (!variants || typeof variants !== 'object') {
      logger.warn(`A/B test "${testId}": Invalid variants object`);
      return null;
    }

    const group = this.getGroup(testId, split);
    return variants[group] || variants['A'] || null;
  }

  /**
   * Register an active test
   * @param {Object} test - Test configuration
   * @param {string} test.id - Test ID
   * @param {string} test.name - Test name
   * @param {Object} test.variantA - Variant A config
   * @param {Object} test.variantB - Variant B config
   * @param {number} test.split - Traffic split
   */
  registerTest(test) {
    if (!test || !test.id) {
      logger.warn('A/B test registration failed: missing id');
      return;
    }

    this._activeTests.set(test.id, {
      id: test.id,
      name: test.name || test.id,
      variantA: test.variantA,
      variantB: test.variantB,
      split: test.split || this.defaultSplit,
      registeredAt: Date.now()
    });

    logger.debug(`A/B test registered: ${test.id}`);
  }

  /**
   * Get registered test
   * @param {string} testId - Test ID
   * @returns {Object|null} Test configuration
   */
  getTest(testId) {
    return this._activeTests.get(testId) || null;
  }

  /**
   * Get all registered tests
   * @returns {Array} Active tests
   */
  getAllTests() {
    return Array.from(this._activeTests.values());
  }

  /**
   * Track conversion event
   * @param {string} testId - Test ID
   * @param {string} conversionType - Type of conversion (click, purchase, etc.)
   * @param {Object} metadata - Additional metadata
   */
  trackConversion(testId, conversionType = 'conversion', metadata = {}) {
    const group = this.getGroup(testId);

    // Send to GA4 dataLayer if available
    this._pushToDataLayer({
      event: 'pwx_ab_conversion',
      test_id: testId,
      group: group,
      conversion_type: conversionType,
      ...metadata
    });

    // Track internally
    this._trackEvent(testId, conversionType, { group, ...metadata });

    logger.debug(`A/B conversion tracked: ${testId} - ${conversionType} (Group ${group})`);
  }

  /**
   * Track impression event
   * @param {string} testId - Test ID
   * @param {Object} metadata - Additional metadata
   */
  trackImpression(testId, metadata = {}) {
    const group = this.getGroup(testId);

    this._pushToDataLayer({
      event: 'pwx_ab_impression',
      test_id: testId,
      group: group,
      ...metadata
    });

    this._trackEvent(testId, 'impression', { group, ...metadata });
  }

  /**
   * Track click event
   * @param {string} testId - Test ID
   * @param {Object} metadata - Additional metadata
   */
  trackClick(testId, metadata = {}) {
    const group = this.getGroup(testId);

    this._pushToDataLayer({
      event: 'pwx_ab_click',
      test_id: testId,
      group: group,
      ...metadata
    });

    this._trackEvent(testId, 'click', { group, ...metadata });
  }

  /**
   * Force user into a specific group (for debugging)
   * @param {string} testId - Test ID
   * @param {string} group - Group to force ('A' or 'B')
   */
  forceGroup(testId, group) {
    if (group !== 'A' && group !== 'B') {
      logger.warn(`Invalid group: ${group}. Must be 'A' or 'B'`);
      return;
    }

    const key = `${STORAGE_KEYS.AB_GROUP}_${testId}`;
    this.storage.set(key, group, 30);
    logger.info(`A/B Test "${testId}": Forced to group ${group}`);
  }

  /**
   * Reset user's group assignment
   * @param {string} testId - Test ID
   */
  resetGroup(testId) {
    const key = `${STORAGE_KEYS.AB_GROUP}_${testId}`;
    this.storage.remove(key);
    logger.debug(`A/B Test "${testId}": Group reset`);
  }

  /**
   * Reset all group assignments
   */
  resetAll() {
    const keys = this.storage.keys();
    keys.forEach(key => {
      if (key.startsWith(STORAGE_KEYS.AB_GROUP)) {
        this.storage.remove(key);
      }
    });
    logger.info('All A/B test groups reset');
  }

  /**
   * Get user's assignments for all tests
   * @returns {Object} Map of testId -> group
   */
  getAllAssignments() {
    const assignments = {};

    try {
      const keys = this.storage.keys();
      keys.forEach(key => {
        if (key.startsWith(`${STORAGE_KEYS.AB_GROUP}_`)) {
          const testId = key.replace(`${STORAGE_KEYS.AB_GROUP}_`, '');
          assignments[testId] = this.storage.get(key);
        }
      });
    } catch (e) {
      logger.warn('Get all assignments error:', e);
    }

    return assignments;
  }

  /**
   * Enable/disable A/B testing
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    logger.debug(`A/B testing ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get statistics
   * @returns {Object}
   */
  getStats() {
    const assignments = this.getAllAssignments();
    const testCount = Object.keys(assignments).length;

    let groupACount = 0;
    let groupBCount = 0;

    Object.values(assignments).forEach(group => {
      if (group === 'A') groupACount++;
      else if (group === 'B') groupBCount++;
    });

    return {
      enabled: this.enabled,
      activeTests: this._activeTests.size,
      assignedTests: testCount,
      groupDistribution: {
        A: groupACount,
        B: groupBCount
      }
    };
  }

  /**
   * Push event to GA4 dataLayer
   * @private
   * @param {Object} data - Event data
   */
  _pushToDataLayer(data) {
    try {
      if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push(data);
      }
    } catch (e) {
      // Silently fail if dataLayer not available
    }
  }

  /**
   * Track event internally (for reporting)
   * @private
   * @param {string} testId - Test ID
   * @param {string} eventType - Event type
   * @param {Object} data - Event data
   */
  _trackEvent(testId, eventType, data) {
    // Emit custom event for potential listeners
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pwx:ab:event', {
          detail: {
            testId,
            eventType,
            ...data,
            timestamp: Date.now()
          }
        }));
      }
    } catch (e) {
      // Silently fail
    }
  }
}

// Create singleton instance
const abTest = new ABTestManager(storage);

export { ABTestManager, abTest };
export default abTest;
