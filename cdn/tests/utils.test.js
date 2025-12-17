/**
 * Utils Module Tests
 * Tests for DOM helpers and utility functions
 */

import {
  parseDataAttributes,
  parseAttributeValue,
  $,
  $$,
  createElement,
  addStyles,
  debounce,
  throttle,
  deepMerge,
  isObject,
  generateId,
  escapeHtml,
  formatPrice,
  EventEmitter,
  logger,
  storage,
} from '../src/core/utils.js';

describe('Utils Module', () => {
  describe('parseDataAttributes', () => {
    it('should parse data-pwx-* attributes from element', () => {
      const element = document.createElement('div');
      element.dataset.pwxSlug = 'elle-shoes';
      element.dataset.pwxWidget = 'carousel';
      element.dataset.pwxLimit = '10';

      const config = parseDataAttributes(element);

      expect(config.slug).toBe('elle-shoes');
      expect(config.widget).toBe('carousel');
      expect(config.limit).toBe(10);
    });

    it('should parse boolean values', () => {
      const element = document.createElement('div');
      element.dataset.pwxAutoplay = 'true';
      element.dataset.pwxShowDots = 'false';

      const config = parseDataAttributes(element);

      expect(config.autoplay).toBe(true);
      expect(config.showDots).toBe(false);
    });

    it('should parse JSON arrays', () => {
      const element = document.createElement('div');
      element.dataset.pwxCategories = '["shoes", "bags", "accessories"]';

      const config = parseDataAttributes(element);

      expect(config.categories).toEqual(['shoes', 'bags', 'accessories']);
    });

    it('should parse JSON objects', () => {
      const element = document.createElement('div');
      element.dataset.pwxSettings = '{"slidesToShow": 4, "autoplay": true}';

      const config = parseDataAttributes(element);

      expect(config.settings).toEqual({ slidesToShow: 4, autoplay: true });
    });

    it('should handle custom prefix', () => {
      const element = document.createElement('div');
      element.dataset.customSlug = 'test-store';
      element.dataset.customWidget = 'popup';

      const config = parseDataAttributes(element, 'custom');

      expect(config.slug).toBe('test-store');
      expect(config.widget).toBe('popup');
    });

    it('should return empty object for null/undefined element', () => {
      expect(parseDataAttributes(null)).toEqual({});
      expect(parseDataAttributes(undefined)).toEqual({});
    });

    it('should ignore non-prefixed data attributes', () => {
      const element = document.createElement('div');
      element.dataset.pwxSlug = 'test';
      element.dataset.otherAttr = 'ignored';

      const config = parseDataAttributes(element);

      expect(config.slug).toBe('test');
      expect(config.otherAttr).toBeUndefined();
    });
  });

  describe('parseAttributeValue', () => {
    it('should return null/undefined as is', () => {
      expect(parseAttributeValue(null)).toBeNull();
      expect(parseAttributeValue(undefined)).toBeUndefined();
    });

    it('should parse boolean strings', () => {
      expect(parseAttributeValue('true')).toBe(true);
      expect(parseAttributeValue('TRUE')).toBe(true);
      expect(parseAttributeValue('false')).toBe(false);
      expect(parseAttributeValue('FALSE')).toBe(false);
    });

    it('should parse numbers', () => {
      expect(parseAttributeValue('42')).toBe(42);
      expect(parseAttributeValue('3.14')).toBe(3.14);
      expect(parseAttributeValue('-10')).toBe(-10);
      expect(parseAttributeValue('-2.5')).toBe(-2.5);
    });

    it('should parse JSON arrays', () => {
      expect(parseAttributeValue('[1, 2, 3]')).toEqual([1, 2, 3]);
      expect(parseAttributeValue('["a", "b"]')).toEqual(['a', 'b']);
    });

    it('should parse JSON objects', () => {
      expect(parseAttributeValue('{"key": "value"}')).toEqual({ key: 'value' });
    });

    it('should return string for invalid JSON', () => {
      expect(parseAttributeValue('[invalid')).toBe('[invalid');
      expect(parseAttributeValue('{broken}')).toBe('{broken}');
    });

    it('should trim whitespace', () => {
      expect(parseAttributeValue('  hello  ')).toBe('hello');
      expect(parseAttributeValue('  42  ')).toBe(42);
    });
  });

  describe('$ and $$ selectors', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div id="container">
          <div class="item">Item 1</div>
          <div class="item">Item 2</div>
          <div class="item">Item 3</div>
        </div>
      `;
    });

    it('should find single element by selector', () => {
      const element = $('#container');
      expect(element).not.toBeNull();
      expect(element.id).toBe('container');
    });

    it('should return null for non-existent element', () => {
      const element = $('#non-existent');
      expect(element).toBeNull();
    });

    it('should find all matching elements', () => {
      const elements = $$('.item');
      expect(elements).toHaveLength(3);
    });

    it('should return empty array for non-matching selector', () => {
      const elements = $$('.non-existent');
      expect(elements).toEqual([]);
    });

    it('should find within context', () => {
      const container = $('#container');
      const items = $$('.item', container);
      expect(items).toHaveLength(3);
    });
  });

  describe('createElement', () => {
    it('should create element with tag name', () => {
      const element = createElement('div');
      expect(element.tagName).toBe('DIV');
    });

    it('should set attributes', () => {
      const element = createElement('a', { href: '/test', target: '_blank' });
      expect(element.getAttribute('href')).toBe('/test');
      expect(element.getAttribute('target')).toBe('_blank');
    });

    it('should set className', () => {
      const element = createElement('div', { className: 'foo bar' });
      expect(element.className).toBe('foo bar');
    });

    it('should set inline styles', () => {
      const element = createElement('div', {
        style: { color: 'red', fontSize: '16px' },
      });
      expect(element.style.color).toBe('red');
      expect(element.style.fontSize).toBe('16px');
    });

    it('should add event listeners', () => {
      const handleClick = jest.fn();
      const element = createElement('button', { onClick: handleClick });

      element.click();

      expect(handleClick).toHaveBeenCalled();
    });

    it('should set data attributes', () => {
      const element = createElement('div', {
        dataset: { testId: '123', name: 'test' },
      });
      expect(element.dataset.testId).toBe('123');
      expect(element.dataset.name).toBe('test');
    });

    it('should add text children', () => {
      const element = createElement('span', {}, 'Hello World');
      expect(element.textContent).toBe('Hello World');
    });

    it('should add element children', () => {
      const child = createElement('span', {}, 'Child');
      const parent = createElement('div', {}, [child]);
      expect(parent.children).toHaveLength(1);
      expect(parent.children[0].textContent).toBe('Child');
    });
  });

  describe('addStyles', () => {
    it('should add style element to head', () => {
      const css = '.test { color: red; }';
      const styleEl = addStyles(css, 'test-styles');

      expect(styleEl.textContent).toBe(css);
      expect(document.getElementById('test-styles')).toBe(styleEl);
    });

    it('should update existing style element', () => {
      addStyles('.old { color: blue; }', 'test-styles');
      addStyles('.new { color: green; }', 'test-styles');

      const styleEl = document.getElementById('test-styles');
      expect(styleEl.textContent).toBe('.new { color: green; }');
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should delay function execution', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced();
      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should only execute once for rapid calls', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced();
      debounced();
      debounced();

      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to function', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced('arg1', 'arg2');
      jest.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should execute immediately on first call', () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 100);

      throttled();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should ignore calls within throttle period', () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 100);

      throttled();
      throttled();
      throttled();

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should allow execution after throttle period', () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 100);

      throttled();
      jest.advanceTimersByTime(100);
      throttled();

      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('deepMerge', () => {
    it('should merge simple objects', () => {
      const target = { a: 1 };
      const source = { b: 2 };

      const result = deepMerge(target, source);

      expect(result).toEqual({ a: 1, b: 2 });
    });

    it('should merge nested objects', () => {
      const target = { a: { x: 1 } };
      const source = { a: { y: 2 }, b: 3 };

      const result = deepMerge(target, source);

      expect(result).toEqual({ a: { x: 1, y: 2 }, b: 3 });
    });

    it('should override non-object values', () => {
      const target = { a: 1, b: { x: 1 } };
      const source = { a: 2, b: { x: 2 } };

      const result = deepMerge(target, source);

      expect(result).toEqual({ a: 2, b: { x: 2 } });
    });

    it('should handle multiple sources', () => {
      const target = { a: 1 };
      const result = deepMerge(target, { b: 2 }, { c: 3 });

      expect(result).toEqual({ a: 1, b: 2, c: 3 });
    });
  });

  describe('isObject', () => {
    it('should return true for plain objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ key: 'value' })).toBe(true);
    });

    it('should return false for arrays', () => {
      expect(isObject([])).toBe(false);
      expect(isObject([1, 2, 3])).toBe(false);
    });

    it('should return false for primitives', () => {
      expect(isObject(null)).toBeFalsy();
      expect(isObject(undefined)).toBeFalsy();
      expect(isObject(42)).toBeFalsy();
      expect(isObject('string')).toBeFalsy();
      expect(isObject(true)).toBeFalsy();
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).not.toBe(id2);
    });

    it('should use default prefix', () => {
      const id = generateId();
      expect(id).toMatch(/^pwx-/);
    });

    it('should use custom prefix', () => {
      const id = generateId('custom');
      expect(id).toMatch(/^custom-/);
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<div>')).toBe('&lt;div&gt;');
      expect(escapeHtml('"quoted"')).toBe('&quot;quoted&quot;');
      expect(escapeHtml("it's")).toBe('it&#x27;s');
      expect(escapeHtml('a & b')).toBe('a &amp; b');
    });

    it('should handle strings with multiple special chars', () => {
      const result = escapeHtml('<script>alert("xss")</script>');
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });

    it('should return non-strings as is', () => {
      expect(escapeHtml(42)).toBe(42);
      expect(escapeHtml(null)).toBe(null);
    });
  });

  describe('formatPrice', () => {
    it('should format price with currency', () => {
      const result = formatPrice(299.99, 'TRY', 'tr-TR');
      expect(result).toContain('299.99');
      expect(result).toContain('TRY');
    });

    it('should use default currency', () => {
      const result = formatPrice(100);
      expect(result).toContain('TRY');
    });
  });

  describe('EventEmitter', () => {
    let emitter;

    beforeEach(() => {
      emitter = new EventEmitter();
    });

    it('should subscribe and emit events', () => {
      const handler = jest.fn();

      emitter.on('test', handler);
      emitter.emit('test', 'arg1', 'arg2');

      expect(handler).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should unsubscribe from events', () => {
      const handler = jest.fn();

      emitter.on('test', handler);
      emitter.off('test', handler);
      emitter.emit('test');

      expect(handler).not.toHaveBeenCalled();
    });

    it('should return unsubscribe function from on()', () => {
      const handler = jest.fn();

      const unsubscribe = emitter.on('test', handler);
      unsubscribe();
      emitter.emit('test');

      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle once() subscriptions', () => {
      const handler = jest.fn();

      emitter.once('test', handler);
      emitter.emit('test');
      emitter.emit('test');

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple subscribers', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      emitter.on('test', handler1);
      emitter.on('test', handler2);
      emitter.emit('test');

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });

  describe('storage', () => {
    it('should set and get values', () => {
      storage.set('testKey', { data: 'value' });
      const result = storage.get('testKey');

      expect(result).toEqual({ data: 'value' });
    });

    it('should return default value for non-existent key', () => {
      const result = storage.get('nonExistent', 'default');
      expect(result).toBe('default');
    });

    it('should remove values', () => {
      storage.set('testKey', 'value');
      storage.remove('testKey');

      expect(storage.get('testKey')).toBeNull();
    });

    it('should prefix keys with pwx_', () => {
      storage.set('myKey', 'value');
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'pwx_myKey',
        '"value"'
      );
    });
  });

  describe('logger', () => {
    beforeEach(() => {
      jest.spyOn(console, 'debug').mockImplementation();
      jest.spyOn(console, 'info').mockImplementation();
      jest.spyOn(console, 'warn').mockImplementation();
      jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should log at appropriate levels', () => {
      logger.setLevel('DEBUG');

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(console.debug).toHaveBeenCalled();
      expect(console.info).toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    it('should respect log level settings', () => {
      logger.setLevel('ERROR');

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });
});
