/**
 * Parsers Index
 * Factory for creating appropriate parser based on feed format
 *
 * @module parsers
 */

const BaseParser = require('./base.parser');
const GoogleParser = require('./google.parser');
const GenericParser = require('./generic.parser');
const logger = require('../utils/logger');

/**
 * Parser factory - creates appropriate parser for feed format
 *
 * @param {string} format - Feed format (google, facebook, custom)
 * @returns {BaseParser} Parser instance
 */
const createParser = (format) => {
  switch (format.toLowerCase()) {
    case 'google':
      logger.info('Using Google Merchant parser');
      return new GoogleParser();

    case 'facebook':
      logger.info('Using Facebook Catalog parser');
      return new GenericParser('facebook');

    case 'custom':
    default:
      logger.info('Using Generic parser');
      return new GenericParser('custom');
  }
};

/**
 * Auto-detect parser based on XML content
 *
 * @param {string} xmlContent - XML content
 * @returns {BaseParser} Detected parser
 */
const detectParser = (xmlContent) => {
  const content = xmlContent.toLowerCase();

  // Check for Google Merchant format
  if (
    content.includes('g:id') ||
    content.includes('g:title') ||
    content.includes('xmlns:g="http://base.google.com')
  ) {
    logger.info('Auto-detected Google Merchant format');
    return new GoogleParser();
  }

  // Check for Facebook format
  if (
    content.includes('xmlns:fb') ||
    content.includes('facebook.com')
  ) {
    logger.info('Auto-detected Facebook Catalog format');
    return new GenericParser('facebook');
  }

  // Default to generic parser
  logger.info('Using generic parser (no specific format detected)');
  return new GenericParser('custom');
};

module.exports = {
  BaseParser,
  GoogleParser,
  GenericParser,
  createParser,
  detectParser
};
