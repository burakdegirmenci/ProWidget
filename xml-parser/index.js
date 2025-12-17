#!/usr/bin/env node

/**
 * ProWidget XML Parser
 * Entry point for feed parsing service
 *
 * Usage:
 *   node index.js                      # Run scheduler (default)
 *   node index.js --mode=scheduler     # Run as scheduler
 *   node index.js --mode=once          # Sync all due feeds once and exit
 *   node index.js --mode=all           # Sync all active feeds once and exit
 *   node index.js --mode=single --customer=<slug>  # Sync single customer
 *   node index.js --mode=single --feed=<feedId>    # Sync single feed
 *   node index.js --stats              # Show statistics
 *
 * @module xml-parser
 */

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const logger = require('./src/utils/logger');
const { parserService, storageService } = require('./src/services');
const { scheduler } = require('./src/jobs');

/**
 * Parse command line arguments
 */
const argv = yargs(hideBin(process.argv))
  .option('mode', {
    alias: 'm',
    type: 'string',
    description: 'Run mode: scheduler, once, all, single',
    default: 'scheduler'
  })
  .option('customer', {
    alias: 'c',
    type: 'string',
    description: 'Customer slug (for single mode)'
  })
  .option('feed', {
    alias: 'f',
    type: 'string',
    description: 'Feed ID (for single mode)'
  })
  .option('stats', {
    alias: 's',
    type: 'boolean',
    description: 'Show statistics and exit'
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Verbose output'
  })
  .help()
  .argv;

/**
 * Main entry point
 */
async function main() {
  logger.info('ProWidget XML Parser starting...');
  logger.info(`Mode: ${argv.mode}`);

  try {
    // Connect to database
    await storageService.connect();

    // Show stats if requested
    if (argv.stats) {
      const stats = await parserService.getStats();
      console.log('\n--- Feed Statistics ---');
      console.log(`Total Feeds: ${stats.feeds.total}`);
      console.log(`Active Feeds: ${stats.feeds.active}`);
      console.log(`Error Feeds: ${stats.feeds.error}`);
      console.log(`Total Products: ${stats.products}`);
      console.log('------------------------\n');
      await storageService.disconnect();
      return;
    }

    // Execute based on mode
    switch (argv.mode) {
      case 'scheduler':
        await runScheduler();
        break;

      case 'once':
        await runOnce();
        break;

      case 'all':
        await runAll();
        break;

      case 'single':
        await runSingle();
        break;

      default:
        logger.error(`Unknown mode: ${argv.mode}`);
        process.exit(1);
    }
  } catch (error) {
    logger.error('Fatal error', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

/**
 * Run as scheduler (continuous)
 */
async function runScheduler() {
  logger.info('Starting in scheduler mode...');

  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down...');
    scheduler.stop();
    await storageService.disconnect();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down...');
    scheduler.stop();
    await storageService.disconnect();
    process.exit(0);
  });

  // Start scheduler
  scheduler.start();

  // Keep process alive
  logger.info('Scheduler running. Press Ctrl+C to stop.');
}

/**
 * Run once for due feeds
 */
async function runOnce() {
  logger.info('Running once for due feeds...');

  const result = await parserService.syncAllDue();

  printResults(result);

  await storageService.disconnect();

  process.exit(result.success ? 0 : 1);
}

/**
 * Run once for all active feeds
 */
async function runAll() {
  logger.info('Running for all active feeds...');

  const result = await parserService.syncAll();

  printResults(result);

  await storageService.disconnect();

  process.exit(result.success ? 0 : 1);
}

/**
 * Run for single customer or feed
 */
async function runSingle() {
  logger.info('Running for single feed...');

  let result;

  if (argv.customer) {
    logger.info(`Syncing customer: ${argv.customer}`);
    result = await parserService.syncByCustomerSlug(argv.customer);
  } else if (argv.feed) {
    logger.info(`Syncing feed: ${argv.feed}`);
    result = await parserService.syncByFeedId(argv.feed);
  } else {
    logger.error('Must specify --customer or --feed for single mode');
    await storageService.disconnect();
    process.exit(1);
  }

  printSingleResult(result);

  await storageService.disconnect();

  process.exit(result.success ? 0 : 1);
}

/**
 * Print sync results
 *
 * @param {Object} result - Sync result
 */
function printResults(result) {
  console.log('\n' + '='.repeat(50));
  console.log('SYNC RESULTS');
  console.log('='.repeat(50));
  console.log(`Status: ${result.success ? 'SUCCESS' : 'PARTIAL FAILURE'}`);
  console.log(`Feeds Processed: ${result.feedsProcessed}`);
  console.log(`Successful: ${result.successCount || 0}`);
  console.log(`Errors: ${result.errorCount || 0}`);
  console.log(`Total Products: ${result.totalProducts || 0}`);
  console.log(`Duration: ${result.durationMs}ms`);
  console.log('='.repeat(50));

  if (result.results && result.results.length > 0) {
    console.log('\nDetailed Results:');
    result.results.forEach((r, i) => {
      const status = r.success ? '✓' : '✗';
      const details = r.success
        ? `${r.productCount} products`
        : r.error;
      console.log(`  ${status} ${r.customerName}: ${details}`);
    });
  }

  console.log('');
}

/**
 * Print single feed result
 *
 * @param {Object} result - Sync result
 */
function printSingleResult(result) {
  console.log('\n' + '='.repeat(50));
  console.log('SYNC RESULT');
  console.log('='.repeat(50));
  console.log(`Customer: ${result.customerName}`);
  console.log(`Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);

  if (result.success) {
    console.log(`Products: ${result.productCount}`);
    console.log(`Campaigns: ${result.campaignCount || 0}`);
    console.log(`Created: ${result.upsertResult?.created || 0}`);
    console.log(`Updated: ${result.upsertResult?.updated || 0}`);
    console.log(`Deactivated: ${result.deactivatedCount || 0}`);
  } else {
    console.log(`Error: ${result.error}`);
  }

  console.log(`Duration: ${result.durationMs}ms`);
  console.log('='.repeat(50) + '\n');
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason: reason?.message || reason });
});

// Run main
main();
