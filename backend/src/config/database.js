/**
 * Database Configuration
 * Prisma client configuration and connection management
 *
 * @module config/database
 */

const { PrismaClient } = require('@prisma/client');
const config = require('./index');

/**
 * Prisma client options based on environment
 * @type {Object}
 */
const prismaOptions = {
  log: config.app.isDevelopment
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
  errorFormat: config.app.isProduction ? 'minimal' : 'pretty'
};

/**
 * Singleton Prisma client instance
 * @type {PrismaClient}
 */
let prisma;

/**
 * Get or create Prisma client instance
 * Implements singleton pattern to avoid multiple connections
 *
 * @returns {PrismaClient} Prisma client instance
 */
const getPrismaClient = () => {
  if (!prisma) {
    prisma = new PrismaClient(prismaOptions);
  }
  return prisma;
};

/**
 * Connect to database
 * @returns {Promise<void>}
 */
const connect = async () => {
  const client = getPrismaClient();
  await client.$connect();
};

/**
 * Disconnect from database
 * @returns {Promise<void>}
 */
const disconnect = async () => {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
};

/**
 * Health check for database connection
 * @returns {Promise<boolean>} True if connected
 */
const healthCheck = async () => {
  try {
    const client = getPrismaClient();
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    return false;
  }
};

module.exports = {
  getPrismaClient,
  connect,
  disconnect,
  healthCheck
};
