/**
 * Services Index
 * Central export for all business logic services
 *
 * @module services
 */

const authService = require('./auth.service');
const customerService = require('./customer.service');
const widgetService = require('./widget.service');
const themeService = require('./theme.service');
const feedService = require('./feed.service');
const productService = require('./product.service');
const templateService = require('./template.service');

module.exports = {
  authService,
  customerService,
  widgetService,
  themeService,
  feedService,
  productService,
  templateService
};
