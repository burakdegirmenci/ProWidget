/**
 * Validators Index
 * Central export for all validation schemas
 *
 * @module validators
 */

const authValidator = require('./auth.validator');
const customerValidator = require('./customer.validator');
const widgetValidator = require('./widget.validator');
const themeValidator = require('./theme.validator');
const feedValidator = require('./feed.validator');
const templateValidator = require('./template.validator');

module.exports = {
  auth: authValidator,
  customer: customerValidator,
  widget: widgetValidator,
  theme: themeValidator,
  feed: feedValidator,
  template: templateValidator
};
