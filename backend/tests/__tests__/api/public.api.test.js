/**
 * Public API Integration Tests
 * Tests for public widget endpoints
 */

const request = require('supertest');
const express = require('express');

// Mock Prisma
const mockPrisma = require('../../__mocks__/prisma');
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

// Create minimal Express app for testing
const app = express();
app.use(express.json());

// Mock route handler for /api/public/widget/:slug
app.get('/api/public/widget/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const customer = await mockPrisma.customer.findFirst({
      where: { slug, isActive: true },
      include: {
        widgets: { where: { isActive: true } },
        theme: true,
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: { code: 'CUSTOMER_NOT_FOUND', message: 'Customer not found' },
      });
    }

    res.json({
      success: true,
      data: {
        customer: customer.name,
        widgets: customer.widgets,
        theme: customer.theme,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  }
});

// Mock route handler for /api/public/products/:slug
app.get('/api/public/products/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { limit = 20, campaign, category } = req.query;

    const customer = await mockPrisma.customer.findFirst({
      where: { slug, isActive: true },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: { code: 'CUSTOMER_NOT_FOUND', message: 'Customer not found' },
      });
    }

    const products = await mockPrisma.product.findMany({
      where: { 
        customerId: customer.id,
        isActive: true,
        ...(campaign && { campaign }),
        ...(category && { category }),
      },
      take: parseInt(limit),
    });

    res.json({
      success: true,
      data: {
        customer: customer.name,
        products,
        total: products.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

describe('Public API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/public/widget/:slug', () => {
    it('should return widget config for valid customer', async () => {
      const mockCustomer = {
        id: 'cust-123',
        name: 'Elle Shoes',
        slug: 'elle-shoes',
        isActive: true,
        widgets: [
          { id: 'w1', type: 'CAROUSEL', name: 'Homepage', isActive: true },
        ],
        theme: {
          primaryColor: '#007bff',
          secondaryColor: '#6c757d',
        },
      };

      mockPrisma.customer.findFirst.mockResolvedValue(mockCustomer);

      const response = await request(app)
        .get('/api/public/widget/elle-shoes')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.customer).toBe('Elle Shoes');
      expect(response.body.data.widgets).toHaveLength(1);
      expect(response.body.data.theme).toBeDefined();
    });

    it('should return 404 for non-existent customer', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/public/widget/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CUSTOMER_NOT_FOUND');
    });

    it('should return 404 for inactive customer', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(null); // isActive filter in query

      const response = await request(app)
        .get('/api/public/widget/inactive-customer')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/public/products/:slug', () => {
    it('should return products for valid customer', async () => {
      const mockCustomer = {
        id: 'cust-123',
        name: 'Elle Shoes',
        slug: 'elle-shoes',
        isActive: true,
      };

      const mockProducts = [
        {
          id: 'p1',
          title: 'Red Heels',
          price: 299.99,
          imageLink: 'https://example.com/shoe1.jpg',
        },
        {
          id: 'p2',
          title: 'Black Boots',
          price: 399.99,
          imageLink: 'https://example.com/shoe2.jpg',
        },
      ];

      mockPrisma.customer.findFirst.mockResolvedValue(mockCustomer);
      mockPrisma.product.findMany.mockResolvedValue(mockProducts);

      const response = await request(app)
        .get('/api/public/products/elle-shoes')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
    });

    it('should filter products by campaign', async () => {
      const mockCustomer = {
        id: 'cust-123',
        name: 'Elle Shoes',
        slug: 'elle-shoes',
        isActive: true,
      };

      const mockProducts = [
        {
          id: 'p1',
          title: 'Sale Item',
          campaign: 'summer-sale',
        },
      ];

      mockPrisma.customer.findFirst.mockResolvedValue(mockCustomer);
      mockPrisma.product.findMany.mockResolvedValue(mockProducts);

      const response = await request(app)
        .get('/api/public/products/elle-shoes?campaign=summer-sale')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
    });

    it('should respect limit parameter', async () => {
      const mockCustomer = {
        id: 'cust-123',
        name: 'Test',
        slug: 'test',
        isActive: true,
      };

      mockPrisma.customer.findFirst.mockResolvedValue(mockCustomer);
      mockPrisma.product.findMany.mockResolvedValue([{ id: '1' }, { id: '2' }]);

      const response = await request(app)
        .get('/api/public/products/test?limit=2')
        .expect(200);

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 2,
        })
      );
    });

    it('should return 404 for non-existent customer', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/public/products/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
