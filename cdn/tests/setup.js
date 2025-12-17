/**
 * Jest Test Setup for CDN
 * Configures jsdom environment
 */

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock Intl.NumberFormat for formatPrice tests
global.Intl = {
  NumberFormat: jest.fn().mockImplementation((locale, options) => ({
    format: jest.fn((value) => {
      const currency = options?.currency || 'TRY';
      return `${value.toFixed(2)} ${currency}`;
    }),
  })),
};

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});
