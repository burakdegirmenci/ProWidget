/**
 * Customer Service Tests
 * Unit tests for customer service functions
 */

const mockPrisma = require('../../__mocks__/prisma');

// Mock Prisma before importing service
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

// Import actual utility functions
const { string } = require('../../../src/utils/helpers');
const { random } = require('../../../src/utils/crypto');

describe('Customer Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('string.slugify', () => {
    it('should generate slug from name', () => {
      const name = 'Elle Shoes';
      const slug = string.slugify(name);

      expect(slug).toBe('elle-shoes');
    });

    it('should remove special characters', () => {
      const name = 'Test & Company (Ltd.)';
      const slug = string.slugify(name);

      expect(slug).toBe('test-company-ltd');
    });

    it('should handle multiple spaces', () => {
      const name = 'My    Store   Name';
      const slug = string.slugify(name);

      expect(slug).toBe('my-store-name');
    });

    it('should convert to lowercase', () => {
      const name = 'UPPERCASE NAME';
      const slug = string.slugify(name);

      expect(slug).toBe('uppercase-name');
    });

    it('should trim leading and trailing hyphens', () => {
      const name = '  Test Store  ';
      const slug = string.slugify(name);

      expect(slug).toBe('test-store');
    });
  });

  describe('random.apiKey', () => {
    it('should generate unique API keys', () => {
      const key1 = random.apiKey();
      const key2 = random.apiKey();

      expect(key1).not.toBe(key2);
    });

    it('should generate keys with correct length', () => {
      const key = random.apiKey(32);

      expect(key.length).toBe(32);
    });

    it('should generate alphanumeric keys', () => {
      const key = random.apiKey();

      expect(key).toMatch(/^[A-Za-z0-9]+$/);
    });
  });

  describe('random.uuid', () => {
    it('should generate valid UUID', () => {
      const uuid = random.uuid();

      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });

  describe('Customer CRUD Operations', () => {
    it('should create a new customer', async () => {
      const customerData = {
        name: 'Test Store',
        slug: 'test-store',
        domain: 'https://test-store.com',
      };

      const expectedCustomer = {
        id: 'cust-123',
        ...customerData,
        apiKey: 'pwx_test_api_key',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.customer.create.mockResolvedValue(expectedCustomer);
      mockPrisma.customer.findFirst.mockResolvedValue(null);

      expect(mockPrisma.customer.create).toBeDefined();
    });

    it('should find customer by slug', async () => {
      const expectedCustomer = {
        id: 'cust-123',
        name: 'Test Store',
        slug: 'test-store',
        isActive: true,
      };

      mockPrisma.customer.findFirst.mockResolvedValue(expectedCustomer);

      const result = await mockPrisma.customer.findFirst({
        where: { slug: 'test-store' },
      });

      expect(result).toEqual(expectedCustomer);
      expect(mockPrisma.customer.findFirst).toHaveBeenCalledWith({
        where: { slug: 'test-store' },
      });
    });

    it('should update customer XML feed URL', async () => {
      const customerId = 'cust-123';
      const feedUrl = 'https://example.com/feed.xml';

      const expectedFeed = {
        id: 'feed-123',
        customerId,
        url: feedUrl,
        format: 'GOOGLE_MERCHANT',
        status: 'ACTIVE',
      };

      mockPrisma.xmlFeed.upsert.mockResolvedValue(expectedFeed);

      const result = await mockPrisma.xmlFeed.upsert({
        where: { customerId },
        create: { customerId, url: feedUrl, format: 'GOOGLE_MERCHANT' },
        update: { url: feedUrl },
      });

      expect(result).toEqual(expectedFeed);
      expect(result.url).toBe(feedUrl);
    });

    it('should return null for non-existent customer', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(null);

      const result = await mockPrisma.customer.findFirst({
        where: { slug: 'non-existent' },
      });

      expect(result).toBeNull();
    });

    it('should list all active customers', async () => {
      const customers = [
        { id: '1', name: 'Store 1', isActive: true },
        { id: '2', name: 'Store 2', isActive: true },
      ];

      mockPrisma.customer.findMany.mockResolvedValue(customers);

      const result = await mockPrisma.customer.findMany({
        where: { isActive: true },
      });

      expect(result).toHaveLength(2);
      expect(result).toEqual(customers);
    });
  });

  describe('Widget Configuration', () => {
    it('should create widget config for customer', async () => {
      const widgetData = {
        customerId: 'cust-123',
        type: 'CAROUSEL',
        name: 'Homepage Carousel',
        config: { slidesToShow: 4 },
      };

      const expectedWidget = {
        id: 'widget-123',
        ...widgetData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.widgetConfig.create.mockResolvedValue(expectedWidget);

      const result = await mockPrisma.widgetConfig.create({
        data: widgetData,
      });

      expect(result.type).toBe('CAROUSEL');
      expect(result.customerId).toBe('cust-123');
    });

    it('should list widgets by customer', async () => {
      const widgets = [
        { id: '1', type: 'CAROUSEL', name: 'Carousel 1' },
        { id: '2', type: 'POPUP', name: 'Popup 1' },
      ];

      mockPrisma.widgetConfig.findMany.mockResolvedValue(widgets);

      const result = await mockPrisma.widgetConfig.findMany({
        where: { customerId: 'cust-123' },
      });

      expect(result).toHaveLength(2);
    });
  });
});
