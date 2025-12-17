/**
 * Auth Service
 * Authentication and authorization business logic
 *
 * @module services/auth
 */

const { prisma } = require('../models');
const { crypto, helpers } = require('../utils');
const { AuthenticationError, NotFoundError } = require('../exceptions');

class AuthService {
  /**
   * Register a new user
   *
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Created user (without password)
   */
  async register(userData) {
    const { email, password, firstName, lastName, role } = userData;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw AuthenticationError.forbidden('User with this email already exists');
    }

    // Hash password
    const passwordHash = await crypto.password.hash(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: role || 'viewer'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    return user;
  }

  /**
   * Authenticate user and generate tokens
   *
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User data with tokens
   */
  async login(email, password) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw AuthenticationError.invalidCredentials();
    }

    if (!user.isActive) {
      throw AuthenticationError.forbidden('Your account has been deactivated');
    }

    // Verify password
    const isValidPassword = await crypto.password.compare(password, user.passwordHash);

    if (!isValidPassword) {
      throw AuthenticationError.invalidCredentials();
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`.trim(),
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      ...tokens
    };
  }

  /**
   * Generate access and refresh tokens
   *
   * @param {Object} user - User object
   * @returns {Promise<Object>} Access and refresh tokens
   */
  async generateTokens(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = crypto.token.generateAccess(payload);
    const refreshToken = crypto.token.generateRefresh({ userId: user.id });

    // Store refresh token in database
    const expiresAt = helpers.date.add(new Date(), 7, 'days');
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt
      }
    });

    return { accessToken, refreshToken };
  }

  /**
   * Refresh access token using refresh token
   *
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New access token
   */
  async refreshToken(refreshToken) {
    // Verify refresh token
    let decoded;
    try {
      decoded = crypto.token.verify(refreshToken, { audience: 'prowidget-refresh' });
    } catch (error) {
      throw AuthenticationError.invalidToken();
    }

    // Find stored refresh token
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    });

    if (!storedToken) {
      throw AuthenticationError.invalidToken();
    }

    // Check if token is expired
    if (helpers.date.isExpired(storedToken.expiresAt)) {
      // Delete expired token
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      throw AuthenticationError.tokenExpired();
    }

    // Check if user is still active
    if (!storedToken.user.isActive) {
      throw AuthenticationError.forbidden('Your account has been deactivated');
    }

    // Generate new access token
    const accessToken = crypto.token.generateAccess({
      userId: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role
    });

    return { accessToken };
  }

  /**
   * Logout user by invalidating refresh token
   *
   * @param {string} refreshToken - Refresh token to invalidate
   * @returns {Promise<void>}
   */
  async logout(refreshToken) {
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken }
      });
    }
  }

  /**
   * Logout from all devices by invalidating all refresh tokens
   *
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async logoutAll(userId) {
    await prisma.refreshToken.deleteMany({
      where: { userId }
    });
  }

  /**
   * Get current user profile
   *
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User profile
   */
  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw NotFoundError.user(userId);
    }

    return {
      ...user,
      name: `${user.firstName} ${user.lastName}`.trim()
    };
  }

  /**
   * Change user password
   *
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw NotFoundError.user(userId);
    }

    // Verify current password
    const isValid = await crypto.password.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw AuthenticationError.invalidCredentials();
    }

    // Hash new password
    const passwordHash = await crypto.password.hash(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });

    // Invalidate all refresh tokens
    await this.logoutAll(userId);
  }

  /**
   * Clean up expired refresh tokens
   *
   * @returns {Promise<number>} Number of deleted tokens
   */
  async cleanupExpiredTokens() {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    });

    return result.count;
  }
}

module.exports = new AuthService();
