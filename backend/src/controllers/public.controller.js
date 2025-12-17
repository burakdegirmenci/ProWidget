/**
 * Public Controller
 * Handles public widget API endpoints (no auth required)
 *
 * @module controllers/public
 */

const {
  customerService,
  widgetService,
  themeService,
  productService
} = require('../services');
const { ApiResponse, logger } = require('../utils');
const { asyncHandler } = require('../middlewares');
const { NotFoundError } = require('../exceptions');

/**
 * Get widget configuration for a customer
 * GET /api/:slug/config
 */
const getConfig = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  // Get customer by slug
  const customer = await customerService.getBySlug(slug);

  if (!customer.isActive) {
    throw NotFoundError.customer(slug);
  }

  // Get active widgets
  const widgets = await widgetService.getActiveWidgets(customer.id);

  // Get active theme
  const theme = await themeService.getThemeForWidget(customer.id);

  const config = {
    customerId: customer.id,
    customerSlug: customer.slug,
    widgets: widgets.map((w) => {
      const widgetData = {
        id: w.id,
        type: w.type,
        name: w.name,
        settings: w.settings,
        placement: w.placement
      };

      // Include template data for custom widgets
      if (w.type === 'custom' && w.template) {
        widgetData.template = {
          id: w.template.id,
          htmlTemplate: w.template.htmlTemplate,
          cssStyles: w.template.cssStyles,
          dataSchema: w.template.dataSchema,
          defaultData: w.template.defaultData
        };
        widgetData.customData = w.customData || {};
      }

      return widgetData;
    }),
    theme
  };

  // Set cache headers
  res.set('Cache-Control', 'public, max-age=60'); // 1 minute cache

  ApiResponse.success(res, config);
});

/**
 * Get theme for a customer
 * GET /api/:slug/theme
 */
const getTheme = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const customer = await customerService.getBySlug(slug);

  if (!customer.isActive) {
    throw NotFoundError.customer(slug);
  }

  const theme = await themeService.getThemeForWidget(customer.id);

  // Set cache headers
  res.set('Cache-Control', 'public, max-age=300'); // 5 minutes cache

  ApiResponse.success(res, theme);
});

/**
 * Get theme CSS for a customer
 * GET /api/:slug/theme.css
 */
const getThemeCss = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const customer = await customerService.getBySlug(slug);

  if (!customer.isActive) {
    throw NotFoundError.customer(slug);
  }

  const theme = await themeService.getActiveTheme(customer.id);

  let css;
  if (theme) {
    css = themeService.generateCss(theme);
  } else {
    // Default theme CSS
    css = `:root {
  --pwx-primary: #000000;
  --pwx-secondary: #ffffff;
  --pwx-background: #ffffff;
  --pwx-text: #333333;
  --pwx-font-family: inherit;
  --pwx-border-radius: 8px;
}`;
  }

  // Set cache headers
  res.set('Cache-Control', 'public, max-age=300');
  res.type('text/css').send(css);
});

/**
 * Get product data for widgets
 * GET /api/:slug/data
 */
const getData = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { limit, category } = req.query;

  const customer = await customerService.getBySlug(slug);

  if (!customer.isActive) {
    throw NotFoundError.customer(slug);
  }

  // Try to get cached data first
  let products = await productService.getCachedData(customer.id);

  // If no cache, get fresh data
  if (!products || products.length === 0) {
    products = await productService.getForWidget(customer.id, {
      limit: parseInt(limit) || 20,
      category
    });

    // Format for widget
    products = products.map((p) => ({
      id: p.externalId,
      title: p.title,
      price: parseFloat(p.price),
      salePrice: p.salePrice ? parseFloat(p.salePrice) : null,
      image: p.imageUrl,
      url: p.productUrl,
      brand: p.brand
    }));
  }

  // Set cache headers
  res.set('Cache-Control', 'public, max-age=300'); // 5 minutes cache

  ApiResponse.success(res, products);
});

/**
 * Get specific widget data
 * GET /api/:slug/widget/:widgetId
 */
const getWidgetData = asyncHandler(async (req, res) => {
  const { slug, widgetId } = req.params;

  const customer = await customerService.getBySlug(slug);

  if (!customer.isActive) {
    throw NotFoundError.customer(slug);
  }

  const widget = await widgetService.getById(widgetId);

  // Verify widget belongs to customer
  if (widget.customerId !== customer.id) {
    throw NotFoundError.widget(widgetId);
  }

  // Get products for this widget
  const products = await productService.getForWidget(customer.id, {
    limit: widget.settings?.productCount || 20
  });

  const data = {
    widget: {
      id: widget.id,
      type: widget.type,
      settings: widget.settings,
      placement: widget.placement
    },
    products: products.map((p) => ({
      id: p.externalId,
      title: p.title,
      price: parseFloat(p.price),
      salePrice: p.salePrice ? parseFloat(p.salePrice) : null,
      image: p.imageUrl,
      url: p.productUrl,
      brand: p.brand
    }))
  };

  res.set('Cache-Control', 'public, max-age=60');
  ApiResponse.success(res, data);
});

/**
 * Health check endpoint
 * GET /api/health
 */
const healthCheck = asyncHandler(async (req, res) => {
  const { healthCheck: dbHealthCheck } = require('../models');
  const dbHealthy = await dbHealthCheck();

  const health = {
    status: dbHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbHealthy ? 'connected' : 'disconnected'
  };

  const statusCode = dbHealthy ? 200 : 503;
  res.status(statusCode).json(health);
});

/**
 * Track widget impression/click (analytics)
 * POST /api/:slug/track
 */
const trackEvent = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { event, widgetId, productId, metadata } = req.body;

  // Log event for now (could be sent to analytics service)
  logger.info('Widget event tracked', {
    customerSlug: slug,
    event,
    widgetId,
    productId,
    metadata,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  ApiResponse.success(res, null, 'Event tracked');
});

module.exports = {
  getConfig,
  getTheme,
  getThemeCss,
  getData,
  getWidgetData,
  healthCheck,
  trackEvent
};
