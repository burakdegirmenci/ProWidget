/**
 * Scheduler
 * Cron-based job scheduler for feed syncing
 *
 * @module jobs/scheduler
 */

const cron = require('node-cron');
const config = require('../config');
const logger = require('../utils/logger');
const { parserService, storageService } = require('../services');

/**
 * Feed sync scheduler
 */
class Scheduler {
  constructor() {
    this.job = null;
    this.isRunning = false;
    this.lastRun = null;
    this.stats = {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0
    };
  }

  /**
   * Start the scheduler
   *
   * @param {string} cronExpression - Cron expression (optional)
   * @returns {void}
   */
  start(cronExpression = config.sync.cronSchedule) {
    if (this.job) {
      logger.warn('Scheduler already running');
      return;
    }

    // Validate cron expression
    if (!cron.validate(cronExpression)) {
      throw new Error(`Invalid cron expression: ${cronExpression}`);
    }

    logger.info(`Starting scheduler with cron: ${cronExpression}`);

    this.job = cron.schedule(cronExpression, async () => {
      await this.runSync();
    }, {
      scheduled: true,
      timezone: 'Europe/Istanbul'
    });

    logger.info('Scheduler started successfully');

    // Run initial sync
    this.runSync();
  }

  /**
   * Stop the scheduler
   *
   * @returns {void}
   */
  stop() {
    if (this.job) {
      this.job.stop();
      this.job = null;
      logger.info('Scheduler stopped');
    }
  }

  /**
   * Run sync operation
   *
   * @returns {Promise<Object>} Sync result
   */
  async runSync() {
    if (this.isRunning) {
      logger.warn('Sync already in progress, skipping...');
      return { skipped: true };
    }

    this.isRunning = true;
    this.stats.totalRuns++;

    try {
      logger.info('='.repeat(50));
      logger.info('Starting scheduled sync...');

      const result = await parserService.syncAllDue();

      this.lastRun = new Date();

      if (result.success) {
        this.stats.successfulRuns++;
      } else {
        this.stats.failedRuns++;
      }

      logger.info('Scheduled sync completed', {
        success: result.success,
        feedsProcessed: result.feedsProcessed,
        duration: `${result.durationMs}ms`
      });

      logger.info('='.repeat(50));

      return result;
    } catch (error) {
      this.stats.failedRuns++;
      logger.error('Scheduled sync failed', { error: error.message });
      return { success: false, error: error.message };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get scheduler status
   *
   * @returns {Object} Scheduler status
   */
  getStatus() {
    return {
      running: !!this.job,
      syncing: this.isRunning,
      lastRun: this.lastRun,
      stats: this.stats,
      cronExpression: config.sync.cronSchedule
    };
  }

  /**
   * Get next scheduled run time
   *
   * @returns {Date|null} Next run time
   */
  getNextRun() {
    if (!this.job) return null;

    // node-cron doesn't have a built-in way to get next run
    // Return approximate based on cron expression
    return null;
  }
}

module.exports = new Scheduler();
