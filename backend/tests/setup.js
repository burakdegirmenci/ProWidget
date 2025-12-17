/**
 * Jest Test Setup
 * Runs before each test file
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.JWT_EXPIRES_IN = '1h';

// Increase timeout for slower operations
jest.setTimeout(10000);

// Clean up after all tests
afterAll(async () => {
  // Add any global cleanup here
});
