/**
 * HTML/CSS Sanitizer
 * Security utilities for sanitizing user-provided HTML and CSS
 *
 * @module utils/sanitizer
 */

const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

// Create a virtual DOM for DOMPurify
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Allowed HTML tags for custom templates
 */
const ALLOWED_TAGS = [
  // Structure
  'div', 'span', 'section', 'article', 'header', 'footer', 'nav', 'main', 'aside',
  // Text
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'b', 'i', 'u', 's',
  'small', 'mark', 'del', 'ins', 'sub', 'sup', 'br', 'hr', 'blockquote', 'pre', 'code',
  // Links & Media
  'a', 'img', 'picture', 'source', 'figure', 'figcaption', 'video', 'audio',
  // Lists
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  // Tables
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
  // Forms (limited)
  'form', 'button', 'input', 'label', 'select', 'option', 'optgroup', 'textarea',
  // Other
  'time', 'abbr', 'address', 'cite', 'q', 'wbr',
  // Advanced templates (admin-only)
  'script', 'style'
];

/**
 * Allowed HTML attributes
 */
const ALLOWED_ATTR = [
  // Global
  'class', 'id', 'style', 'title', 'lang', 'dir', 'hidden', 'tabindex',
  // Links
  'href', 'target', 'rel', 'download',
  // Media
  'src', 'srcset', 'alt', 'width', 'height', 'loading', 'decoding',
  'poster', 'controls', 'autoplay', 'loop', 'muted', 'preload',
  // Forms
  'type', 'name', 'value', 'placeholder', 'disabled', 'readonly', 'required',
  'checked', 'selected', 'multiple', 'min', 'max', 'minlength', 'maxlength',
  'pattern', 'step', 'for', 'autocomplete',
  // Tables
  'colspan', 'rowspan', 'scope',
  // PWX custom data attributes
  'data-pwx-action', 'data-pwx-event', 'data-pwx-payload',
  'data-pwx-target', 'data-pwx-toggle', 'data-pwx-track'
];

/**
 * Forbidden HTML tags (explicitly blocked)
 * Note: script and style removed - allowed for advanced admin templates
 */
const FORBID_TAGS = [
  'iframe', 'object', 'embed', 'link', 'meta', 'base',
  'applet', 'frame', 'frameset', 'layer', 'ilayer', 'bgsound', 'xml'
];

/**
 * Forbidden attributes (event handlers)
 */
const FORBID_ATTR = [
  // Mouse events
  'onclick', 'ondblclick', 'onmousedown', 'onmouseup', 'onmouseover',
  'onmouseout', 'onmousemove', 'onmouseenter', 'onmouseleave',
  // Keyboard events
  'onkeydown', 'onkeyup', 'onkeypress',
  // Form events
  'onsubmit', 'onreset', 'oninput', 'onchange', 'onfocus', 'onblur', 'onselect',
  // Window events
  'onload', 'onunload', 'onbeforeunload', 'onerror', 'onresize', 'onscroll',
  // Media events
  'onplay', 'onpause', 'onended', 'oncanplay', 'onloadeddata',
  // Touch events
  'ontouchstart', 'ontouchmove', 'ontouchend', 'ontouchcancel',
  // Drag events
  'ondrag', 'ondragstart', 'ondragend', 'ondragenter', 'ondragleave', 'ondragover', 'ondrop',
  // Other dangerous
  'onabort', 'onanimationend', 'onanimationstart', 'oncontextmenu', 'oncopy',
  'oncut', 'onpaste', 'onwheel', 'formaction', 'xlink:href', 'xmlns'
];

/**
 * DOMPurify configuration
 */
const SANITIZE_CONFIG = {
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  FORBID_TAGS,
  FORBID_ATTR,
  ALLOW_DATA_ATTR: false, // Only allow explicitly listed data-pwx-* attrs
  ALLOW_ARIA_ATTR: true,
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
  WHOLE_DOCUMENT: false,
  FORCE_BODY: false,
  SANITIZE_DOM: true,
  IN_PLACE: false
};

/**
 * Sanitize HTML content
 *
 * @param {string} html - HTML string to sanitize
 * @param {Object} options - Additional options
 * @returns {Object} Result with sanitized HTML and any warnings
 */
function sanitizeHtml(html, options = {}) {
  if (!html || typeof html !== 'string') {
    return {
      sanitized: '',
      warnings: [],
      isClean: true
    };
  }

  const warnings = [];
  const originalLength = html.length;

  // Custom hook to track removed elements
  DOMPurify.addHook('uponSanitizeElement', (node, data) => {
    if (data.allowedTags && !data.allowedTags[data.tagName]) {
      warnings.push(`Removed forbidden tag: <${data.tagName}>`);
    }
  });

  DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
    if (FORBID_ATTR.includes(data.attrName.toLowerCase())) {
      warnings.push(`Removed forbidden attribute: ${data.attrName}`);
    }
  });

  // Sanitize
  const config = { ...SANITIZE_CONFIG, ...options };
  const sanitized = DOMPurify.sanitize(html, config);

  // Clear hooks
  DOMPurify.removeAllHooks();

  // Check if content was modified
  const isClean = sanitized.length >= originalLength * 0.95; // Allow 5% size reduction from whitespace

  return {
    sanitized,
    warnings,
    isClean,
    originalLength,
    sanitizedLength: sanitized.length
  };
}

/**
 * Validate HTML without modifying it
 *
 * @param {string} html - HTML string to validate
 * @returns {Object} Validation result
 */
function validateHtml(html) {
  if (!html || typeof html !== 'string') {
    return { valid: true, errors: [] };
  }

  const errors = [];

  // Note: Script tags are now allowed for advanced widget templates
  // Security is handled by admin-only template creation

  // Check for iframe tags
  if (/<iframe[\s>]/i.test(html)) {
    errors.push('Iframe tags are not allowed');
  }

  // Check for event handlers
  const eventHandlerPattern = /\bon\w+\s*=/gi;
  const eventMatches = html.match(eventHandlerPattern);
  if (eventMatches) {
    errors.push(`Event handlers are not allowed: ${eventMatches.join(', ')}`);
  }

  // Check for javascript: URLs
  if (/javascript\s*:/i.test(html)) {
    errors.push('JavaScript URLs are not allowed');
  }

  // Check for data: URLs in sensitive contexts
  if (/(?:src|href)\s*=\s*["']?\s*data:/i.test(html)) {
    errors.push('Data URLs in src/href are not allowed');
  }

  // Check for expression() in styles
  if (/expression\s*\(/i.test(html)) {
    errors.push('CSS expressions are not allowed');
  }

  // Check for base64 encoded scripts
  if (/base64[^"']*(?:PHNjcmlwdD|c2NyaXB0)/i.test(html)) {
    errors.push('Base64 encoded scripts are not allowed');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * CSS validation patterns
 */
const CSS_FORBIDDEN_PATTERNS = [
  { pattern: /@import\s+url\s*\(/i, message: 'External @import URLs are not allowed' },
  { pattern: /@import\s+["']/i, message: 'External @import URLs are not allowed' },
  { pattern: /expression\s*\(/i, message: 'CSS expressions are not allowed' },
  { pattern: /javascript\s*:/i, message: 'JavaScript in CSS is not allowed' },
  { pattern: /behavior\s*:/i, message: 'CSS behaviors are not allowed' },
  { pattern: /-moz-binding/i, message: 'XBL bindings are not allowed' },
  { pattern: /binding\s*:/i, message: 'CSS bindings are not allowed' },
  { pattern: /@charset/i, message: '@charset is not allowed' },
  { pattern: /@namespace/i, message: '@namespace is not allowed' },
  { pattern: /url\s*\(\s*["']?\s*data:(?!image)/i, message: 'Non-image data URLs are not allowed' }
];

/**
 * Validate CSS content
 *
 * @param {string} css - CSS string to validate
 * @returns {Object} Validation result
 */
function validateCss(css) {
  if (!css || typeof css !== 'string') {
    return { valid: true, errors: [] };
  }

  const errors = [];

  for (const { pattern, message } of CSS_FORBIDDEN_PATTERNS) {
    if (pattern.test(css)) {
      errors.push(message);
    }
  }

  // Check for potentially dangerous property values
  const dangerousValues = /(?:url|image)\s*\(\s*["']?\s*(?:javascript|vbscript|data:(?!image))/gi;
  if (dangerousValues.test(css)) {
    errors.push('Dangerous URL values detected in CSS');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize CSS content
 *
 * @param {string} css - CSS string to sanitize
 * @returns {Object} Result with sanitized CSS
 */
function sanitizeCss(css) {
  if (!css || typeof css !== 'string') {
    return {
      sanitized: '',
      warnings: [],
      isClean: true
    };
  }

  const warnings = [];
  let sanitized = css;

  // Remove @import statements
  sanitized = sanitized.replace(/@import\s+[^;]+;?/gi, (match) => {
    warnings.push(`Removed: ${match.trim()}`);
    return '';
  });

  // Remove expression()
  sanitized = sanitized.replace(/expression\s*\([^)]*\)/gi, (match) => {
    warnings.push(`Removed CSS expression`);
    return 'none';
  });

  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript\s*:[^;}"')]+/gi, (match) => {
    warnings.push(`Removed JavaScript URL in CSS`);
    return 'none';
  });

  // Remove behavior: property
  sanitized = sanitized.replace(/behavior\s*:[^;}"')]+/gi, (match) => {
    warnings.push(`Removed CSS behavior`);
    return '';
  });

  // Remove -moz-binding
  sanitized = sanitized.replace(/-moz-binding\s*:[^;}"')]+/gi, (match) => {
    warnings.push(`Removed XBL binding`);
    return '';
  });

  return {
    sanitized: sanitized.trim(),
    warnings,
    isClean: warnings.length === 0
  };
}

/**
 * Full template validation
 *
 * @param {string} html - HTML template
 * @param {string} css - CSS styles
 * @returns {Object} Combined validation result
 */
function validateTemplate(html, css) {
  const htmlValidation = validateHtml(html);
  const cssValidation = validateCss(css);

  return {
    valid: htmlValidation.valid && cssValidation.valid,
    htmlErrors: htmlValidation.errors,
    cssErrors: cssValidation.errors,
    errors: [...htmlValidation.errors, ...cssValidation.errors]
  };
}

/**
 * Full template sanitization
 *
 * @param {string} html - HTML template
 * @param {string} css - CSS styles
 * @returns {Object} Combined sanitization result
 */
function sanitizeTemplate(html, css) {
  const htmlResult = sanitizeHtml(html);
  const cssResult = sanitizeCss(css);

  return {
    html: htmlResult.sanitized,
    css: cssResult.sanitized,
    warnings: [...htmlResult.warnings, ...cssResult.warnings],
    isClean: htmlResult.isClean && cssResult.isClean
  };
}

module.exports = {
  sanitizeHtml,
  validateHtml,
  sanitizeCss,
  validateCss,
  validateTemplate,
  sanitizeTemplate,
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  FORBID_TAGS,
  FORBID_ATTR
};
