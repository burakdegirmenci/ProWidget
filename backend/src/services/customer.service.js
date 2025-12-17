/**
 * Customer Service
 * Customer management business logic
 *
 * @module services/customer
 */

const { prisma } = require('../models');
const { crypto, helpers } = require('../utils');
const { NotFoundError, AppError } = require('../exceptions');

class CustomerService {
  /**
   * Create a new customer
   *
   * @param {Object} customerData - Customer data
   * @returns {Promise<Object>} Created customer
   */
  async create(customerData) {
    const { name, slug, domain, description, logoUrl, isActive } = customerData;

    // Generate unique API key
    const apiKey = crypto.random.apiKey();

    const customer = await prisma.customer.create({
      data: {
        name,
        slug,
        domain,
        description,
        logoUrl,
        apiKey,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    return customer;
  }

  /**
   * Get customer by ID
   *
   * @param {string} id - Customer ID
   * @returns {Promise<Object>} Customer
   */
  async getById(id) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            widgetConfigs: true,
            themes: true,
            xmlFeeds: true,
            products: true
          }
        }
      }
    });

    if (!customer) {
      throw NotFoundError.customer(id);
    }

    return customer;
  }

  /**
   * Get customer by slug
   *
   * @param {string} slug - Customer slug
   * @returns {Promise<Object>} Customer
   */
  async getBySlug(slug) {
    const customer = await prisma.customer.findUnique({
      where: { slug }
    });

    if (!customer) {
      throw NotFoundError.customer(slug);
    }

    return customer;
  }

  /**
   * Get all customers with pagination and filters
   *
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated customers
   */
  async getAll(options = {}) {
    const { page, limit, skip } = helpers.pagination.parse(options);
    const { search, isActive, sortBy, sortOrder } = options;

    // Build where clause
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { domain: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Get total count
    const total = await prisma.customer.count({ where });

    // Get customers
    const customers = await prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy || 'createdAt']: sortOrder || 'desc' },
      include: {
        _count: {
          select: {
            widgetConfigs: true,
            themes: true,
            xmlFeeds: true,
            products: true
          }
        }
      }
    });

    return {
      data: customers,
      pagination: helpers.pagination.buildMeta(total, page, limit)
    };
  }

  /**
   * Update customer
   *
   * @param {string} id - Customer ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated customer
   */
  async update(id, updateData) {
    // Check if customer exists
    await this.getById(id);

    const { name, slug, domain, description, logoUrl, isActive } = updateData;

    const customer = await prisma.customer.update({
      where: { id },
      data: helpers.object.removeEmpty({
        name,
        slug,
        domain,
        description,
        logoUrl,
        isActive
      })
    });

    return customer;
  }

  /**
   * Delete customer
   *
   * @param {string} id - Customer ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    // Check if customer exists
    await this.getById(id);

    await prisma.customer.delete({
      where: { id }
    });
  }

  /**
   * Regenerate API key for customer
   *
   * @param {string} id - Customer ID
   * @returns {Promise<Object>} Customer with new API key
   */
  async regenerateApiKey(id) {
    // Check if customer exists
    await this.getById(id);

    const newApiKey = crypto.random.apiKey();

    const customer = await prisma.customer.update({
      where: { id },
      data: { apiKey: newApiKey }
    });

    return customer;
  }

  /**
   * Check if slug is available
   *
   * @param {string} slug - Slug to check
   * @param {string} excludeId - Customer ID to exclude (for updates)
   * @returns {Promise<boolean>} True if available
   */
  async isSlugAvailable(slug, excludeId = null) {
    const where = { slug };

    if (excludeId) {
      where.NOT = { id: excludeId };
    }

    const existing = await prisma.customer.findFirst({ where });
    return !existing;
  }

  /**
   * Get customer statistics
   *
   * @param {string} id - Customer ID
   * @returns {Promise<Object>} Customer statistics
   */
  async getStats(id) {
    const customer = await this.getById(id);

    const [widgetCount, activeWidgets, themeCount, feedCount, productCount] = await Promise.all([
      prisma.widgetConfig.count({ where: { customerId: id } }),
      prisma.widgetConfig.count({ where: { customerId: id, isActive: true } }),
      prisma.theme.count({ where: { customerId: id } }),
      prisma.xmlFeed.count({ where: { customerId: id } }),
      prisma.product.count({ where: { customerId: id } })
    ]);

    return {
      customerId: id,
      customerName: customer.name,
      widgets: {
        total: widgetCount,
        active: activeWidgets
      },
      themes: themeCount,
      feeds: feedCount,
      products: productCount
    };
  }

  /**
   * Verify API key
   *
   * @param {string} apiKey - API key to verify
   * @returns {Promise<Object|null>} Customer if valid, null otherwise
   */
  async verifyApiKey(apiKey) {
    const customer = await prisma.customer.findUnique({
      where: { apiKey },
      select: {
        id: true,
        slug: true,
        name: true,
        isActive: true
      }
    });

    if (!customer || !customer.isActive) {
      return null;
    }

    return customer;
  }
}

module.exports = new CustomerService();
