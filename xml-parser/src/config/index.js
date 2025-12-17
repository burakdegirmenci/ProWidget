/**
 * XML Parser Configuration
 * Centralizes all configuration for the parser service
 *
 * @module config
 */

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Fallback to backend .env if parser .env doesn't exist
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.join(__dirname, '../../../backend/.env') });
}

/**
 * Configuration object
 */
const config = {
  // Database
  database: {
    url: process.env.DATABASE_URL
  },

  // Sync settings
  sync: {
    cronSchedule: process.env.SYNC_CRON_SCHEDULE || '*/15 * * * *', // Every 15 minutes
    timeoutMs: parseInt(process.env.SYNC_TIMEOUT_MS, 10) || 30000,
    retryCount: parseInt(process.env.SYNC_RETRY_COUNT, 10) || 3,
    retryDelayMs: parseInt(process.env.SYNC_RETRY_DELAY_MS, 10) || 5000,
    maxConcurrent: parseInt(process.env.MAX_CONCURRENT_SYNCS, 10) || 5
  },

  // HTTP client settings
  http: {
    timeoutMs: parseInt(process.env.HTTP_TIMEOUT_MS, 10) || 30000,
    maxRedirects: parseInt(process.env.HTTP_MAX_REDIRECTS, 10) || 5,
    userAgent: process.env.HTTP_USER_AGENT || 'ProWidget-FeedParser/1.0'
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/xml-parser.log'
  },

  // Feed format field mappings
  fieldMappings: {
    google: {
      id: ['g:id', 'id'],
      title: ['g:title', 'title'],
      description: ['g:description', 'description'],
      price: ['g:price', 'price'],
      salePrice: ['g:sale_price', 'sale_price'],
      imageUrl: ['g:image_link', 'image_link', 'image'],
      productUrl: ['g:link', 'link'],
      category: ['g:product_type', 'g:google_product_category', 'category'],
      brand: ['g:brand', 'brand'],
      availability: ['g:availability', 'availability'],
      currency: ['g:price', 'price'] // Will be extracted from price string
    },
    facebook: {
      id: ['id'],
      title: ['title'],
      description: ['description'],
      price: ['price'],
      salePrice: ['sale_price'],
      imageUrl: ['image_link', 'image_url'],
      productUrl: ['link', 'url'],
      category: ['product_type', 'category'],
      brand: ['brand'],
      availability: ['availability'],
      currency: ['price']
    },
    custom: {
      id: ['id', 'sku', 'product_id', 'code'],
      title: ['title', 'name', 'product_name'],
      description: ['description', 'desc', 'content'],
      price: ['price', 'regular_price', 'list_price'],
      salePrice: ['sale_price', 'special_price', 'discount_price'],
      imageUrl: ['image', 'image_url', 'img', 'picture'],
      productUrl: ['url', 'link', 'product_url'],
      category: ['category', 'categories', 'product_type'],
      brand: ['brand', 'manufacturer', 'vendor'],
      availability: ['availability', 'stock', 'in_stock'],
      currency: ['currency', 'price']
    }
  }
};

// Freeze to prevent modifications
Object.freeze(config);

module.exports = config;
