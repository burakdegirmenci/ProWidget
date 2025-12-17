/**
 * Express Application Setup
 * Configures Express app with all middlewares and routes
 *
 * @module app
 */

const express = require('express');
const helmet = require('helmet');
const compression = require('compression');

const config = require('./config');
const routes = require('./routes');
const {
  combinedCors,
  apiLimiter,
  httpLogger,
  requestTiming,
  requestId,
  notFoundHandler,
  errorHandler
} = require('./middlewares');

/**
 * Create and configure Express application
 * @returns {express.Application} Configured Express app
 */
const createApp = () => {
  const app = express();

  // ===========================================
  // Security Middlewares
  // ===========================================

  // Set security HTTP headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false, // Required for some CDN scenarios
    crossOriginResourcePolicy: { policy: 'cross-origin' } // Allow cross-origin for widgets
  }));

  // Enable CORS
  app.use(combinedCors);

  // ===========================================
  // Performance Middlewares
  // ===========================================

  // Compress responses
  app.use(compression({
    level: 6,
    threshold: 1024, // Only compress responses larger than 1KB
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  }));

  // ===========================================
  // Request Processing
  // ===========================================

  // Add request ID for tracing
  app.use(requestId);

  // Request timing
  app.use(requestTiming);

  // HTTP request logging
  app.use(httpLogger);

  // Parse JSON bodies
  app.use(express.json({
    limit: '10mb',
    strict: true
  }));

  // Parse URL-encoded bodies
  app.use(express.urlencoded({
    extended: true,
    limit: '10mb'
  }));

  // ===========================================
  // Rate Limiting
  // ===========================================

  // Apply general rate limiting to all routes
  app.use('/api', apiLimiter);

  // ===========================================
  // Trust Proxy (for rate limiting behind reverse proxy)
  // ===========================================

  if (config.app.isProduction) {
    app.set('trust proxy', 1);
  }

  // ===========================================
  // API Routes
  // ===========================================

  app.use('/api', routes);

  // ===========================================
  // Root endpoint
  // ===========================================

  app.get('/', (req, res) => {
    res.json({
      name: 'ProWidget API',
      version: '1.0.0',
      status: 'running',
      documentation: '/api/docs',
      health: '/api/health'
    });
  });

  // ===========================================
  // Error Handling
  // ===========================================

  // Handle 404
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
