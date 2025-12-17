/**
 * Storage Service
 * Handles storing parsed data to database
 *
 * @module services/storage
 */

const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

/**
 * Service for storing parsed feed data
 */
class StorageService {
  constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
    });
  }

  /**
   * Connect to database
   * @returns {Promise<void>}
   */
  async connect() {
    await this.prisma.$connect();
    logger.info('Database connected');
  }

  /**
   * Disconnect from database
   * @returns {Promise<void>}
   */
  async disconnect() {
    await this.prisma.$disconnect();
    logger.info('Database disconnected');
  }

  /**
   * Get all active feeds that need syncing
   *
   * @returns {Promise<Array>} Feeds to sync
   */
  async getFeedsToSync() {
    const feeds = await this.prisma.xmlFeed.findMany({
      where: {
        isActive: true,
        customer: {
          isActive: true
        },
        OR: [
          { nextSyncAt: { lte: new Date() } },
          { lastSyncAt: null }
        ]
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: {
        nextSyncAt: 'asc'
      }
    });

    return feeds;
  }

  /**
   * Get all active feeds
   *
   * @returns {Promise<Array>} All active feeds
   */
  async getAllActiveFeeds() {
    return this.prisma.xmlFeed.findMany({
      where: {
        isActive: true,
        customer: {
          isActive: true
        }
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });
  }

  /**
   * Get feed by ID
   *
   * @param {string} feedId - Feed ID
   * @returns {Promise<Object>} Feed
   */
  async getFeedById(feedId) {
    return this.prisma.xmlFeed.findUnique({
      where: { id: feedId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });
  }

  /**
   * Get feed by customer slug
   *
   * @param {string} slug - Customer slug
   * @returns {Promise<Object>} Feed
   */
  async getFeedByCustomerSlug(slug) {
    const customer = await this.prisma.customer.findUnique({
      where: { slug },
      include: {
        xmlFeeds: {
          where: { isActive: true },
          take: 1
        }
      }
    });

    if (!customer || customer.xmlFeeds.length === 0) {
      return null;
    }

    return {
      ...customer.xmlFeeds[0],
      customer: {
        id: customer.id,
        name: customer.name,
        slug: customer.slug
      }
    };
  }

  /**
   * Update feed status to syncing
   *
   * @param {string} feedId - Feed ID
   * @returns {Promise<void>}
   */
  async markFeedSyncing(feedId) {
    await this.prisma.xmlFeed.update({
      where: { id: feedId },
      data: {
        status: 'syncing'
      }
    });
  }

  /**
   * Update feed after successful sync
   *
   * @param {string} feedId - Feed ID
   * @param {number} productCount - Number of products
   * @param {number} syncIntervalMinutes - Sync interval
   * @returns {Promise<void>}
   */
  async markFeedSuccess(feedId, productCount, syncIntervalMinutes) {
    const nextSyncAt = new Date(Date.now() + syncIntervalMinutes * 60 * 1000);

    await this.prisma.xmlFeed.update({
      where: { id: feedId },
      data: {
        status: 'active',
        lastSyncAt: new Date(),
        nextSyncAt,
        productCount,
        errorMessage: null
      }
    });
  }

  /**
   * Update feed after failed sync
   *
   * @param {string} feedId - Feed ID
   * @param {string} errorMessage - Error message
   * @returns {Promise<void>}
   */
  async markFeedError(feedId, errorMessage) {
    await this.prisma.xmlFeed.update({
      where: { id: feedId },
      data: {
        status: 'error',
        errorMessage: errorMessage.slice(0, 1000)
      }
    });
  }

  /**
   * Upsert products from feed
   *
   * @param {string} customerId - Customer ID
   * @param {string} feedId - Feed ID
   * @param {Array} products - Normalized products
   * @returns {Promise<Object>} Upsert result
   */
  async upsertProducts(customerId, feedId, products) {
    let created = 0;
    let updated = 0;
    let errors = 0;

    // Process in batches
    const batchSize = 100;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);

      const operations = batch.map((product) =>
        this.prisma.product.upsert({
          where: {
            customerId_externalId: {
              customerId,
              externalId: product.id
            }
          },
          create: {
            customerId,
            feedId,
            externalId: product.id,
            title: product.title,
            description: product.description || null,
            price: product.price,
            salePrice: product.salePrice,
            currency: product.currency,
            imageUrl: product.image || null,
            productUrl: product.url || null,
            category: product.category || null,
            brand: product.brand || null,
            stockStatus: product.stock,
            attributes: product.attributes || {},
            isActive: true
          },
          update: {
            feedId,
            title: product.title,
            description: product.description || null,
            price: product.price,
            salePrice: product.salePrice,
            currency: product.currency,
            imageUrl: product.image || null,
            productUrl: product.url || null,
            category: product.category || null,
            brand: product.brand || null,
            stockStatus: product.stock,
            attributes: product.attributes || {},
            isActive: true
          }
        }).catch((err) => {
          errors++;
          logger.warn(`Failed to upsert product ${product.id}`, { error: err.message });
          return null;
        })
      );

      const results = await Promise.all(operations);

      // Count created vs updated (approximate)
      results.forEach((result) => {
        if (result) {
          const isNew = result.createdAt.getTime() === result.updatedAt.getTime();
          if (isNew) created++;
          else updated++;
        }
      });
    }

    return { created, updated, errors, total: products.length };
  }

  /**
   * Deactivate products not in current feed
   *
   * @param {string} customerId - Customer ID
   * @param {string} feedId - Feed ID
   * @param {Array} activeIds - Active product external IDs
   * @returns {Promise<number>} Number deactivated
   */
  async deactivateOldProducts(customerId, feedId, activeIds) {
    const result = await this.prisma.product.updateMany({
      where: {
        customerId,
        feedId,
        externalId: { notIn: activeIds },
        isActive: true
      },
      data: {
        isActive: false
      }
    });

    return result.count;
  }

  /**
   * Update feed cache
   *
   * @param {string} customerId - Customer ID
   * @param {Array} products - Products for cache
   * @param {Array} campaigns - Campaigns for cache
   * @returns {Promise<void>}
   */
  async updateFeedCache(customerId, products, campaigns = []) {
    // Format for widget consumption
    const payload = {
      products: products.slice(0, 100).map((p) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        salePrice: p.salePrice,
        image: p.image,
        url: p.url,
        category: p.category,
        brand: p.brand,
        stock: p.stock
      })),
      campaigns: campaigns.slice(0, 10),
      updatedAt: new Date().toISOString()
    };

    await this.prisma.feedCache.upsert({
      where: { customerId },
      create: {
        customerId,
        payload,
        checksum: this.generateChecksum(payload)
      },
      update: {
        payload,
        checksum: this.generateChecksum(payload)
      }
    });

    logger.info(`Updated feed cache for customer ${customerId}`);
  }

  /**
   * Generate checksum for cache validation
   *
   * @param {Object} data - Data to checksum
   * @returns {string} Checksum
   */
  generateChecksum(data) {
    const crypto = require('crypto');
    const str = JSON.stringify(data);
    return crypto.createHash('md5').update(str).digest('hex');
  }

  /**
   * Get sync statistics
   *
   * @returns {Promise<Object>} Statistics
   */
  async getStats() {
    const [totalFeeds, activeFeeds, errorFeeds, totalProducts] = await Promise.all([
      this.prisma.xmlFeed.count(),
      this.prisma.xmlFeed.count({ where: { status: 'active' } }),
      this.prisma.xmlFeed.count({ where: { status: 'error' } }),
      this.prisma.product.count({ where: { isActive: true } })
    ]);

    return {
      feeds: {
        total: totalFeeds,
        active: activeFeeds,
        error: errorFeeds
      },
      products: totalProducts
    };
  }
}

module.exports = new StorageService();
