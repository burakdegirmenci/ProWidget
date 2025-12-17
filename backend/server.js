/**
 * Server Entry Point
 * Starts the HTTP server and handles graceful shutdown
 *
 * @module server
 */

const http = require('http');
const createApp = require('./src/app');
const config = require('./src/config');
const { logger } = require('./src/utils');
const { connect, disconnect } = require('./src/models');

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Connect to database
    logger.info('Connecting to database...');
    await connect();
    logger.info('Database connected successfully');

    // Create Express app
    const app = createApp();

    // Create HTTP server
    const server = http.createServer(app);

    // Start listening
    server.listen(config.app.port, () => {
      logger.info(`Server started successfully`, {
        port: config.app.port,
        environment: config.app.env,
        nodeVersion: process.version,
        pid: process.pid
      });

      if (config.app.isDevelopment) {
        logger.info(`API available at http://localhost:${config.app.port}/api`);
        logger.info(`Health check at http://localhost:${config.app.port}/api/health`);
      }
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${config.app.port} is already in use`);
        process.exit(1);
      }
      throw error;
    });

    // ===========================================
    // Graceful Shutdown
    // ===========================================

    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      // Stop accepting new connections
      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          // Disconnect from database
          await disconnect();
          logger.info('Database disconnected');

          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown', { error: error.message });
          process.exit(1);
        }
      });

      // Force close after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    // Listen for shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // ===========================================
    // Unhandled Errors
    // ===========================================

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', {
        error: error.message,
        stack: error.stack
      });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', {
        reason: reason instanceof Error ? reason.message : reason,
        stack: reason instanceof Error ? reason.stack : undefined
      });
    });

  } catch (error) {
    logger.error('Failed to start server', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

// Start the server
startServer();
