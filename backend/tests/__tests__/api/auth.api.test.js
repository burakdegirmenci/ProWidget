/**
 * Auth API Integration Tests
 * Tests for authentication endpoints
 */

const request = require('supertest');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mock Prisma
const mockPrisma = require('../../__mocks__/prisma');
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

const JWT_SECRET = 'test-jwt-secret';

// Create minimal Express app for testing
const app = express();
app.use(express.json());

// Mock login endpoint
app.post('/api/admin/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email and password required' },
      });
    }

    const user = await mockPrisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      });
    }

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  }
});

// Mock me endpoint
app.get('/api/admin/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'No token provided' },
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await mockPrisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid token' },
      });
    }
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  }
});

describe('Auth API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/admin/auth/login', () => {
    it('should login with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const mockUser = {
        id: 'user-123',
        email: 'admin@test.com',
        name: 'Admin User',
        passwordHash: hashedPassword,
        role: 'ADMIN',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/admin/auth/login')
        .send({ email: 'admin@test.com', password: 'password123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.email).toBe('admin@test.com');
    });

    it('should reject invalid password', async () => {
      const hashedPassword = await bcrypt.hash('correct-password', 10);
      
      const mockUser = {
        id: 'user-123',
        email: 'admin@test.com',
        passwordHash: hashedPassword,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/admin/auth/login')
        .send({ email: 'admin@test.com', password: 'wrong-password' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/admin/auth/login')
        .send({ email: 'nonexistent@test.com', password: 'password' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject missing credentials', async () => {
      const response = await request(app)
        .post('/api/admin/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/admin/auth/me', () => {
    it('should return user info with valid token', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'admin@test.com',
        name: 'Admin User',
        role: 'ADMIN',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const token = jwt.sign(
        { userId: 'user-123', email: 'admin@test.com', role: 'ADMIN' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/admin/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('admin@test.com');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/admin/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/admin/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
  });
});
