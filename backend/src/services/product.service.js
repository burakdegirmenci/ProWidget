/**
 * Product Service
 * Product data management business logic
 *
 * @module services/product
 */

const { prisma } = require('../models');
const { helpers } = require('../utils');
const { NotFoundError } = require('../exceptions');

class ProductService {
  /**
   * Get product by ID
   *
   * @param {string} id - Product ID
   * @returns {Promise<Object>} Product
   */
  async getById(id) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        feed: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!product) {
      throw NotFoundError.product(id);
    }

    return product;
  }

  /**
   * Get products for a customer with pagination and filters
   *
   * @param {string} customerId - Customer ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated products
   */
  async getByCustomer(customerId, options = {}) {
    const { page, limit, skip } = helpers.pagination.parse(options);
    const {
      search,
      category,
      brand,
      stockStatus,
      minPrice,
      maxPrice,
      sortBy,
      sortOrder
    } = options;

    // Build where clause
    const where = { customerId, isActive: true };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (category) {
      where.category = { contains: category, mode: 'insensitive' };
    }

    if (brand) {
      where.brand = { contains: brand, mode: 'insensitive' };
    }

    if (stockStatus) {
      where.stockStatus = stockStatus;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    // Get total count
    const total = await prisma.product.count({ where });

    // Get products
    const products = await prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy || 'createdAt']: sortOrder || 'desc' },
      select: {
        id: true,
        externalId: true,
        title: true,
        description: true,
        price: true,
        salePrice: true,
        currency: true,
        imageUrl: true,
        productUrl: true,
        category: true,
        brand: true,
        stockStatus: true,
        attributes: true
      }
    });

    return {
      data: products,
      pagination: helpers.pagination.buildMeta(total, page, limit)
    };
  }

  /**
   * Get products for widget display (simplified)
   *
   * @param {string} customerId - Customer ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Products for widget
   */
  async getForWidget(customerId, options = {}) {
    const { limit = 20, category, excludeOutOfStock = true } = options;

    const where = {
      customerId,
      isActive: true
    };

    if (excludeOutOfStock) {
      where.stockStatus = { not: 'out_of_stock' };
    }

    if (category) {
      where.category = { contains: category, mode: 'insensitive' };
    }

    const products = await prisma.product.findMany({
      where,
      take: limit,
      orderBy: [{ salePrice: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        externalId: true,
        title: true,
        price: true,
        salePrice: true,
        currency: true,
        imageUrl: true,
        productUrl: true,
        brand: true,
        stockStatus: true
      }
    });

    return products;
  }

  /**
   * Search products
   *
   * @param {string} customerId - Customer ID
   * @param {string} query - Search query
   * @param {number} limit - Result limit
   * @returns {Promise<Array>} Search results
   */
  async search(customerId, query, limit = 10) {
    const products = await prisma.product.findMany({
      where: {
        customerId,
        isActive: true,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { brand: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: limit,
      select: {
        id: true,
        title: true,
        price: true,
        salePrice: true,
        imageUrl: true,
        productUrl: true
      }
    });

    return products;
  }

  /**
   * Upsert products from feed sync
   *
   * @param {string} customerId - Customer ID
   * @param {string} feedId - Feed ID
   * @param {Array} products - Products to upsert
   * @returns {Promise<Object>} Sync result
   */
  async upsertFromFeed(customerId, feedId, products) {
    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const product of products) {
      try {
        await prisma.product.upsert({
          where: {
            customerId_externalId: {
              customerId,
              externalId: product.externalId
            }
          },
          create: {
            customerId,
            feedId,
            externalId: product.externalId,
            title: product.title,
            description: product.description,
            price: product.price,
            salePrice: product.salePrice,
            currency: product.currency || 'TRY',
            imageUrl: product.imageUrl,
            productUrl: product.productUrl,
            category: product.category,
            brand: product.brand,
            stockStatus: product.stockStatus || 'in_stock',
            attributes: product.attributes || {},
            isActive: true
          },
          update: {
            feedId,
            title: product.title,
            description: product.description,
            price: product.price,
            salePrice: product.salePrice,
            currency: product.currency,
            imageUrl: product.imageUrl,
            productUrl: product.productUrl,
            category: product.category,
            brand: product.brand,
            stockStatus: product.stockStatus,
            attributes: product.attributes,
            isActive: true
          }
        });

        // Check if it was created or updated
        const existing = await prisma.product.findFirst({
          where: {
            customerId,
            externalId: product.externalId,
            createdAt: { gte: new Date(Date.now() - 1000) }
          }
        });

        if (existing) {
          created++;
        } else {
          updated++;
        }
      } catch (error) {
        errors++;
      }
    }

    return { created, updated, errors, total: products.length };
  }

  /**
   * Mark products as inactive for a feed
   *
   * @param {string} feedId - Feed ID
   * @param {Array} activeExternalIds - External IDs of active products
   * @returns {Promise<number>} Number of deactivated products
   */
  async deactivateOldProducts(feedId, activeExternalIds) {
    const result = await prisma.product.updateMany({
      where: {
        feedId,
        externalId: { notIn: activeExternalIds }
      },
      data: { isActive: false }
    });

    return result.count;
  }

  /**
   * Get unique categories for a customer
   *
   * @param {string} customerId - Customer ID
   * @returns {Promise<Array>} Unique categories
   */
  async getCategories(customerId) {
    const products = await prisma.product.findMany({
      where: {
        customerId,
        isActive: true,
        category: { not: null }
      },
      distinct: ['category'],
      select: { category: true }
    });

    return products.map((p) => p.category).filter(Boolean);
  }

  /**
   * Get unique brands for a customer
   *
   * @param {string} customerId - Customer ID
   * @returns {Promise<Array>} Unique brands
   */
  async getBrands(customerId) {
    const products = await prisma.product.findMany({
      where: {
        customerId,
        isActive: true,
        brand: { not: null }
      },
      distinct: ['brand'],
      select: { brand: true }
    });

    return products.map((p) => p.brand).filter(Boolean);
  }

  /**
   * Get product statistics for a customer
   *
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Product statistics
   */
  async getStats(customerId) {
    const [total, active, inStock, onSale] = await Promise.all([
      prisma.product.count({ where: { customerId } }),
      prisma.product.count({ where: { customerId, isActive: true } }),
      prisma.product.count({
        where: { customerId, isActive: true, stockStatus: 'in_stock' }
      }),
      prisma.product.count({
        where: {
          customerId,
          isActive: true,
          salePrice: { not: null }
        }
      })
    ]);

    return { total, active, inStock, onSale };
  }

  /**
   * Update feed cache for a customer
   *
   * @param {string} customerId - Customer ID
   * @returns {Promise<void>}
   */
  async updateFeedCache(customerId) {
    // Get all active products for widget
    const products = await this.getForWidget(customerId, { limit: 100 });

    // Format for cache
    const payload = products.map((p) => ({
      id: p.externalId,
      title: p.title,
      price: parseFloat(p.price),
      salePrice: p.salePrice ? parseFloat(p.salePrice) : null,
      image: p.imageUrl,
      url: p.productUrl,
      brand: p.brand
    }));

    // Upsert feed cache
    await prisma.feedCache.upsert({
      where: { customerId },
      create: {
        customerId,
        payload
      },
      update: {
        payload
      }
    });
  }

  /**
   * Get cached feed data for widget
   *
   * @param {string} customerId - Customer ID
   * @returns {Promise<Array>} Cached products
   */
  async getCachedData(customerId) {
    const cache = await prisma.feedCache.findUnique({
      where: { customerId }
    });

    return cache?.payload || [];
  }
}

module.exports = new ProductService();
