/**
 * Models Index
 * Exports Prisma client and database utilities
 *
 * @module models
 */

const { getPrismaClient, connect, disconnect, healthCheck } = require('../config/database');

// Export Prisma client instance
const prisma = getPrismaClient();

module.exports = {
  prisma,
  connect,
  disconnect,
  healthCheck
};
