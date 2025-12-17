/**
 * Parser Service
 * Orchestrates the feed parsing process
 *
 * @module services/parser
 */

const { createParser, detectParser } = require('../parsers');
const { productNormalizer } = require('../normalizers');
const fetcherService = require('./fetcher.service');
const storageService = require('./storage.service');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * Main service that orchestrates feed parsing
 */
class ParserService {
  /**
   * Sync a single feed
   *
   * @param {Object} feed - Feed object from database
   * @returns {Promise<Object>} Sync result
   */
  async syncFeed(feed) {
    const startTime = Date.now();
    const { id: feedId, url, format, customerId, syncInterval } = feed;
    const customerName = feed.customer?.name || 'Unknown';

    logger.syncStart(customerId, customerName);

    try {
      // Mark feed as syncing
      await storageService.markFeedSyncing(feedId);

      // Validate URL
      if (!fetcherService.isValidUrl(url)) {
        throw new Error(`Invalid feed URL: ${url}`);
      }

      // Fetch XML content
      const fetchResult = await fetcherService.fetchWithMetadata(url);

      if (!fetchResult.success) {
        throw new Error(`Failed to fetch feed: ${fetchResult.error}`);
      }

      // Create parser based on format
      const parser = format ? createParser(format) : detectParser(fetchResult.content);

      // Parse XML
      const parsed = parser.parse(fetchResult.content);

      // Normalize products
      const normalizedProducts = productNormalizer.normalize(parsed.products);
      const deduplicatedProducts = productNormalizer.deduplicate(normalizedProducts);

      if (deduplicatedProducts.length === 0) {
        throw new Error('No valid products found in feed');
      }

      // Store products
      const upsertResult = await storageService.upsertProducts(
        customerId,
        feedId,
        deduplicatedProducts
      );

      // Deactivate products no longer in feed
      const activeIds = deduplicatedProducts.map((p) => p.id);
      const deactivatedCount = await storageService.deactivateOldProducts(
        customerId,
        feedId,
        activeIds
      );

      // Update feed cache
      await storageService.updateFeedCache(
        customerId,
        deduplicatedProducts,
        parsed.campaigns
      );

      // Mark feed as successful
      await storageService.markFeedSuccess(feedId, deduplicatedProducts.length, syncInterval);

      const duration = Date.now() - startTime;
      logger.syncSuccess(customerId, deduplicatedProducts.length, duration);

      return {
        success: true,
        feedId,
        customerId,
        customerName,
        productCount: deduplicatedProducts.length,
        campaignCount: parsed.campaigns.length,
        upsertResult,
        deactivatedCount,
        durationMs: duration
      };
    } catch (error) {
      // Mark feed as error
      await storageService.markFeedError(feedId, error.message);

      logger.syncError(customerId, error);

      return {
        success: false,
        feedId,
        customerId,
        customerName,
        error: error.message,
        durationMs: Date.now() - startTime
      };
    }
  }

  /**
   * Sync all feeds due for sync
   *
   * @returns {Promise<Object>} Sync results
   */
  async syncAllDue() {
    logger.info('Starting sync for all due feeds...');
    const startTime = Date.now();

    // Get feeds to sync
    const feeds = await storageService.getFeedsToSync();

    if (feeds.length === 0) {
      logger.info('No feeds due for sync');
      return {
        success: true,
        feedsProcessed: 0,
        results: []
      };
    }

    logger.info(`Found ${feeds.length} feeds to sync`);

    // Process feeds with concurrency limit
    const results = await this.processWithConcurrency(
      feeds,
      (feed) => this.syncFeed(feed),
      config.sync.maxConcurrent
    );

    const successCount = results.filter((r) => r.success).length;
    const errorCount = results.filter((r) => !r.success).length;
    const totalProducts = results
      .filter((r) => r.success)
      .reduce((sum, r) => sum + r.productCount, 0);

    const duration = Date.now() - startTime;

    logger.info(`Sync completed`, {
      feedsProcessed: feeds.length,
      success: successCount,
      errors: errorCount,
      totalProducts,
      durationMs: duration
    });

    return {
      success: errorCount === 0,
      feedsProcessed: feeds.length,
      successCount,
      errorCount,
      totalProducts,
      durationMs: duration,
      results
    };
  }

  /**
   * Sync all active feeds regardless of schedule
   *
   * @returns {Promise<Object>} Sync results
   */
  async syncAll() {
    logger.info('Starting sync for all active feeds...');
    const startTime = Date.now();

    const feeds = await storageService.getAllActiveFeeds();

    if (feeds.length === 0) {
      logger.info('No active feeds found');
      return {
        success: true,
        feedsProcessed: 0,
        results: []
      };
    }

    logger.info(`Found ${feeds.length} active feeds`);

    const results = await this.processWithConcurrency(
      feeds,
      (feed) => this.syncFeed(feed),
      config.sync.maxConcurrent
    );

    const successCount = results.filter((r) => r.success).length;
    const errorCount = results.filter((r) => !r.success).length;

    return {
      success: errorCount === 0,
      feedsProcessed: feeds.length,
      successCount,
      errorCount,
      durationMs: Date.now() - startTime,
      results
    };
  }

  /**
   * Sync a single customer's feed by slug
   *
   * @param {string} slug - Customer slug
   * @returns {Promise<Object>} Sync result
   */
  async syncByCustomerSlug(slug) {
    const feed = await storageService.getFeedByCustomerSlug(slug);

    if (!feed) {
      throw new Error(`No active feed found for customer: ${slug}`);
    }

    return this.syncFeed(feed);
  }

  /**
   * Sync a single feed by ID
   *
   * @param {string} feedId - Feed ID
   * @returns {Promise<Object>} Sync result
   */
  async syncByFeedId(feedId) {
    const feed = await storageService.getFeedById(feedId);

    if (!feed) {
      throw new Error(`Feed not found: ${feedId}`);
    }

    return this.syncFeed(feed);
  }

  /**
   * Process items with concurrency limit
   *
   * @param {Array} items - Items to process
   * @param {Function} fn - Processing function
   * @param {number} concurrency - Max concurrent operations
   * @returns {Promise<Array>} Results
   */
  async processWithConcurrency(items, fn, concurrency) {
    const results = [];
    const executing = new Set();

    for (const item of items) {
      const promise = fn(item).then((result) => {
        executing.delete(promise);
        return result;
      });

      results.push(promise);
      executing.add(promise);

      if (executing.size >= concurrency) {
        await Promise.race(executing);
      }
    }

    return Promise.all(results);
  }

  /**
   * Get sync statistics
   *
   * @returns {Promise<Object>} Stats
   */
  async getStats() {
    return storageService.getStats();
  }
}

module.exports = new ParserService();
