/**
 * Jest Configuration for CDN
 * Uses jsdom for DOM simulation
 */

module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  moduleFileExtensions: ['js'],
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.min.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'clover'],
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
};
