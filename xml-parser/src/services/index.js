/**
 * Services Index
 * Central export for all services
 *
 * @module services
 */

const fetcherService = require('./fetcher.service');
const storageService = require('./storage.service');
const parserService = require('./parser.service');

module.exports = {
  fetcherService,
  storageService,
  parserService
};
