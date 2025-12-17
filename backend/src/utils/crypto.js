/**
 * Crypto Utility
 * Encryption, hashing, and security utilities
 *
 * @module utils/crypto
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');
const { API_KEY_LENGTH } = require('../config/constants');

/**
 * Password hashing and verification
 */
const password = {
  /**
   * Hash a password using bcrypt
   *
   * @param {string} plainPassword - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  async hash(plainPassword) {
    return bcrypt.hash(plainPassword, config.bcrypt.rounds);
  },

  /**
   * Compare password with hash
   *
   * @param {string} plainPassword - Plain text password
   * @param {string} hashedPassword - Hashed password
   * @returns {Promise<boolean>} True if match
   */
  async compare(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
};

/**
 * JWT token generation and verification
 */
const token = {
  /**
   * Generate access token
   *
   * @param {Object} payload - Token payload
   * @returns {string} JWT access token
   */
  generateAccess(payload) {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.accessExpiry,
      issuer: 'prowidget',
      audience: 'prowidget-api'
    });
  },

  /**
   * Generate refresh token
   *
   * @param {Object} payload - Token payload
   * @returns {string} JWT refresh token
   */
  generateRefresh(payload) {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.refreshExpiry,
      issuer: 'prowidget',
      audience: 'prowidget-refresh'
    });
  },

  /**
   * Verify token
   *
   * @param {string} tokenString - JWT token
   * @param {Object} options - Verification options
   * @returns {Object} Decoded token payload
   * @throws {Error} If token is invalid
   */
  verify(tokenString, options = {}) {
    return jwt.verify(tokenString, config.jwt.secret, {
      issuer: 'prowidget',
      ...options
    });
  },

  /**
   * Decode token without verification
   *
   * @param {string} tokenString - JWT token
   * @returns {Object|null} Decoded token or null
   */
  decode(tokenString) {
    return jwt.decode(tokenString);
  },

  /**
   * Extract token from Authorization header
   *
   * @param {string} authHeader - Authorization header value
   * @returns {string|null} Token or null
   */
  extractFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.slice(7);
  }
};

/**
 * Random value generation
 */
const random = {
  /**
   * Generate random bytes as hex string
   *
   * @param {number} length - Number of bytes
   * @returns {string} Hex string
   */
  hex(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  },

  /**
   * Generate random alphanumeric string
   *
   * @param {number} length - String length
   * @returns {string} Random string
   */
  alphanumeric(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      result += chars[bytes[i] % chars.length];
    }
    return result;
  },

  /**
   * Generate UUID v4
   *
   * @returns {string} UUID
   */
  uuid() {
    return crypto.randomUUID();
  },

  /**
   * Generate API key
   *
   * @param {number} length - Key length
   * @returns {string} API key
   */
  apiKey(length = API_KEY_LENGTH) {
    return this.alphanumeric(length);
  }
};

/**
 * Hashing utilities
 */
const hash = {
  /**
   * Create SHA256 hash
   *
   * @param {string} data - Data to hash
   * @returns {string} Hash hex string
   */
  sha256(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  },

  /**
   * Create MD5 hash (for checksums, not security)
   *
   * @param {string} data - Data to hash
   * @returns {string} Hash hex string
   */
  md5(data) {
    return crypto.createHash('md5').update(data).digest('hex');
  },

  /**
   * Create HMAC signature
   *
   * @param {string} data - Data to sign
   * @param {string} secret - Secret key
   * @param {string} algorithm - Hash algorithm
   * @returns {string} HMAC hex string
   */
  hmac(data, secret, algorithm = 'sha256') {
    return crypto.createHmac(algorithm, secret).update(data).digest('hex');
  }
};

/**
 * Encryption utilities (AES-256-GCM)
 */
const encryption = {
  /**
   * Encrypt data
   *
   * @param {string} text - Plain text to encrypt
   * @param {string} key - Encryption key (32 bytes for AES-256)
   * @returns {Object} Encrypted data with iv and tag
   */
  encrypt(text, key = config.jwt.secret.slice(0, 32)) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: authTag.toString('hex')
    };
  },

  /**
   * Decrypt data
   *
   * @param {string} encrypted - Encrypted hex string
   * @param {string} iv - Initialization vector hex string
   * @param {string} tag - Auth tag hex string
   * @param {string} key - Encryption key
   * @returns {string} Decrypted text
   */
  decrypt(encrypted, iv, tag, key = config.jwt.secret.slice(0, 32)) {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(key),
      Buffer.from(iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(tag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
};

module.exports = {
  password,
  token,
  random,
  hash,
  encryption
};
