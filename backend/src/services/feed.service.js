/**
 * Feed Service
 * XML feed management business logic
 *
 * @module services/feed
 */

const { prisma } = require('../models');
const { helpers } = require('../utils');
const { NotFoundError } = require('../exceptions');

class FeedService {
  /**
   * Create a new XML feed
   *
   * @param {string} customerId - Customer ID
   * @param {Object} feedData - Feed data
   * @returns {Promise<Object>} Created feed
   */
  async create(customerId, feedData) {
    const { name, url, format, syncInterval, isActive } = feedData;

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      throw NotFoundError.customer(customerId);
    }

    // Calculate next sync time
    const nextSyncAt = helpers.date.add(new Date(), syncInterval || 60, 'minutes');

    const feed = await prisma.xmlFeed.create({
      data: {
        customerId,
        name,
        url,
        format: format || 'google',
        syncInterval: syncInterval || 60,
        nextSyncAt,
        status: 'pending',
        isActive: isActive !== undefined ? isActive : true
      }
    });

    return feed;
  }

  /**
   * Get feed by ID
   *
   * @param {string} id - Feed ID
   * @returns {Promise<Object>} Feed
   */
  async getById(id) {
    const feed = await prisma.xmlFeed.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: { products: true }
        }
      }
    });

    if (!feed) {
      throw NotFoundError.feed(id);
    }

    return feed;
  }

  /**
   * Get all feeds for a customer
   *
   * @param {string} customerId - Customer ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Feeds
   */
  async getByCustomer(customerId, options = {}) {
    const { status, isActive } = options;

    const where = { customerId };

    if (status) {
      where.status = status;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const feeds = await prisma.xmlFeed.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    return feeds;
  }

  /**
   * Update feed
   *
   * @param {string} id - Feed ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated feed
   */
  async update(id, updateData) {
    // Check if feed exists
    await this.getById(id);

    const { name, url, format, syncInterval, isActive } = updateData;

    // Recalculate next sync time if interval changed
    let nextSyncAt;
    if (syncInterval) {
      nextSyncAt = helpers.date.add(new Date(), syncInterval, 'minutes');
    }

    const feed = await prisma.xmlFeed.update({
      where: { id },
      data: helpers.object.removeEmpty({
        name,
        url,
        format,
        syncInterval,
        nextSyncAt,
        isActive
      })
    });

    return feed;
  }

  /**
   * Delete feed
   *
   * @param {string} id - Feed ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    // Check if feed exists
    await this.getById(id);

    // Delete associated products first
    await prisma.product.deleteMany({
      where: { feedId: id }
    });

    await prisma.xmlFeed.delete({
      where: { id }
    });
  }

  /**
   * Update feed status
   *
   * @param {string} id - Feed ID
   * @param {string} status - New status
   * @param {string} errorMessage - Error message (optional)
   * @returns {Promise<Object>} Updated feed
   */
  async updateStatus(id, status, errorMessage = null) {
    const updateData = {
      status,
      errorMessage: status === 'error' ? errorMessage : null
    };

    if (status === 'active') {
      updateData.lastSyncAt = new Date();
    }

    const feed = await prisma.xmlFeed.update({
      where: { id },
      data: updateData
    });

    return feed;
  }

  /**
   * Mark feed as synced
   *
   * @param {string} id - Feed ID
   * @param {number} productCount - Number of products synced
   * @returns {Promise<Object>} Updated feed
   */
  async markSynced(id, productCount) {
    const feed = await this.getById(id);

    const nextSyncAt = helpers.date.add(new Date(), feed.syncInterval, 'minutes');

    const updated = await prisma.xmlFeed.update({
      where: { id },
      data: {
        status: 'active',
        lastSyncAt: new Date(),
        nextSyncAt,
        productCount,
        errorMessage: null
      }
    });

    return updated;
  }

  /**
   * Get feeds due for sync
   *
   * @returns {Promise<Array>} Feeds that need syncing
   */
  async getFeedsDueForSync() {
    const feeds = await prisma.xmlFeed.findMany({
      where: {
        isActive: true,
        OR: [
          { nextSyncAt: { lte: new Date() } },
          { lastSyncAt: null }
        ]
      },
      include: {
        customer: {
          select: {
            id: true,
            slug: true
          }
        }
      }
    });

    return feeds;
  }

  /**
   * Trigger manual sync for a feed
   *
   * @param {string} id - Feed ID
   * @returns {Promise<Object>} Feed marked for sync
   */
  async triggerSync(id) {
    const feed = await prisma.xmlFeed.update({
      where: { id },
      data: {
        status: 'syncing',
        nextSyncAt: new Date() // Set to now to trigger sync
      }
    });

    return feed;
  }

  /**
   * Get feed statistics for a customer
   *
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Feed statistics
   */
  async getStats(customerId) {
    const feeds = await prisma.xmlFeed.findMany({
      where: { customerId },
      select: {
        status: true,
        productCount: true,
        lastSyncAt: true
      }
    });

    const stats = {
      total: feeds.length,
      active: feeds.filter((f) => f.status === 'active').length,
      error: feeds.filter((f) => f.status === 'error').length,
      pending: feeds.filter((f) => f.status === 'pending').length,
      totalProducts: feeds.reduce((sum, f) => sum + (f.productCount || 0), 0)
    };

    return stats;
  }
}

module.exports = new FeedService();
