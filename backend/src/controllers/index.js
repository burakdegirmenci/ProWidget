/**
 * Controllers Index
 * Central export for all HTTP controllers
 *
 * @module controllers
 */

const authController = require('./auth.controller');
const customerController = require('./customer.controller');
const widgetController = require('./widget.controller');
const themeController = require('./theme.controller');
const feedController = require('./feed.controller');
const productController = require('./product.controller');
const publicController = require('./public.controller');
const templateController = require('./template.controller');

module.exports = {
  authController,
  customerController,
  widgetController,
  themeController,
  feedController,
  productController,
  publicController,
  templateController
};
