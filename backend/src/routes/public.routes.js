/**
 * Public Routes
 * Public widget API endpoints (no auth required)
 *
 * @module routes/public
 */

const express = require('express');
const router = express.Router();
const { publicController } = require('../controllers');
const { publicApiLimiter, validateApiKey } = require('../middlewares');

// Apply public API rate limiter
router.use(publicApiLimiter);

// Optionally validate API key (for tracking/analytics)
router.use(validateApiKey);

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/health', publicController.healthCheck);

// ========================================
// CDN Widget Routes (used by pwx.min.js)
// ========================================

/**
 * @route   GET /api/public/widget/:slug
 * @desc    Get widget configuration for customer (CDN)
 * @access  Public
 */
router.get('/public/widget/:slug', publicController.getConfig);

/**
 * @route   GET /api/public/products/:slug
 * @desc    Get products for customer (CDN)
 * @access  Public
 */
router.get('/public/products/:slug', publicController.getData);

/**
 * @route   GET /api/public/theme/:slug
 * @desc    Get theme for customer (CDN)
 * @access  Public
 */
router.get('/public/theme/:slug', publicController.getTheme);

/**
 * @route   POST /api/public/track/:slug
 * @desc    Track widget events (CDN)
 * @access  Public
 */
router.post('/public/track/:slug', publicController.trackEvent);

// ========================================
// Legacy Routes (backward compatibility)
// ========================================

/**
 * @route   GET /api/:slug/config
 * @desc    Get widget configuration for customer
 * @access  Public
 */
router.get('/:slug/config', publicController.getConfig);

/**
 * @route   GET /api/:slug/theme
 * @desc    Get theme for customer
 * @access  Public
 */
router.get('/:slug/theme', publicController.getTheme);

/**
 * @route   GET /api/:slug/theme.css
 * @desc    Get theme CSS for customer
 * @access  Public
 */
router.get('/:slug/theme.css', publicController.getThemeCss);

/**
 * @route   GET /api/:slug/data
 * @desc    Get product data for widgets
 * @access  Public
 */
router.get('/:slug/data', publicController.getData);

/**
 * @route   GET /api/:slug/widget/:widgetId
 * @desc    Get specific widget data
 * @access  Public
 */
router.get('/:slug/widget/:widgetId', publicController.getWidgetData);

/**
 * @route   POST /api/:slug/track
 * @desc    Track widget events (impressions, clicks)
 * @access  Public
 */
router.post('/:slug/track', publicController.trackEvent);

module.exports = router;
