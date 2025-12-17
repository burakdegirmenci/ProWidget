/**
 * Recently Viewed Widget
 * Displays products the user has recently viewed
 * Uses localStorage-based tracking
 *
 * @module widgets/recently-viewed
 */

import BaseWidget from './BaseWidget.js';
import { createElement, logger, escapeHtml, formatPrice } from '../core/utils.js';

/**
 * Default template for recently viewed products
 */
const DEFAULT_TEMPLATE = `
<div class="pwx-rv-container">
  <div class="pwx-rv-header">
    <h3 class="pwx-rv-title">{{title}}</h3>
  </div>
  <div class="pwx-rv-grid">
    {{#each products}}
    <a href="{{url}}" class="pwx-rv-item" data-product-id="{{id}}" target="_blank" rel="noopener noreferrer">
      <div class="pwx-rv-image-wrapper">
        <img src="{{image}}" alt="{{title}}" loading="lazy" class="pwx-rv-image">
      </div>
      <div class="pwx-rv-info">
        <span class="pwx-rv-name">{{title}}</span>
        <span class="pwx-rv-price">{{formattedPrice}}</span>
      </div>
    </a>
    {{/each}}
  </div>
</div>
`;

/**
 * RecentlyViewedWidget Class
 * Shows products from user's browsing history
 */
class RecentlyViewedWidget extends BaseWidget {
  /**
   * Widget type identifier
   */
  static type = 'recently-viewed';

  /**
   * Default options
   */
  static defaultOptions = {
    ...BaseWidget.defaultOptions,
    // Number of products to show
    limit: 6,
    // Widget title
    title: 'Son Goruntulediginiz Urunler',
    // Hide widget if no products
    hideIfEmpty: true,
    // Exclude current product (for product pages)
    excludeCurrent: true,
    // Layout: 'grid' | 'slider'
    layout: 'grid',
    // Number of columns in grid
    columns: 6,
    // Responsive column counts
    responsiveColumns: {
      mobile: 2,
      tablet: 4,
      desktop: 6
    },
    // Show visit count badge
    showVisitCount: false,
    // Min products to show widget
    minProducts: 1
  };

  /**
   * Constructor
   */
  constructor(params) {
    super(params);

    /**
     * Tracker reference (will be set from PWX.tracker)
     * @type {Tracker|null}
     */
    this.tracker = null;
  }

  /**
   * Before init hook - get tracker reference
   */
  async beforeInit() {
    // Get tracker from global PWX if available
    if (typeof window !== 'undefined' && window.PWX && window.PWX.tracker) {
      this.tracker = window.PWX.tracker;
    }
  }

  /**
   * Get widget styles
   */
  getStyles() {
    return `
      ${super.getStyles()}

      /* Recently Viewed Widget Styles */
      .${this.cssPrefix}-recently-viewed {
        width: 100%;
      }

      .pwx-rv-container {
        width: 100%;
      }

      .pwx-rv-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
        padding: 0 4px;
      }

      .pwx-rv-title {
        font-size: 18px;
        font-weight: 600;
        color: #333;
        margin: 0;
      }

      .pwx-rv-grid {
        display: grid;
        grid-template-columns: repeat(${this.options.columns || 6}, 1fr);
        gap: 16px;
      }

      /* Responsive grid */
      @media (max-width: 1024px) {
        .pwx-rv-grid {
          grid-template-columns: repeat(${this.options.responsiveColumns?.tablet || 4}, 1fr);
        }
      }

      @media (max-width: 640px) {
        .pwx-rv-grid {
          grid-template-columns: repeat(${this.options.responsiveColumns?.mobile || 2}, 1fr);
          gap: 12px;
        }

        .pwx-rv-title {
          font-size: 16px;
        }
      }

      .pwx-rv-item {
        display: block;
        text-decoration: none;
        color: inherit;
        background: #fff;
        border-radius: var(--pwx-border-radius, 8px);
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .pwx-rv-item:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      }

      .pwx-rv-image-wrapper {
        position: relative;
        aspect-ratio: 1;
        overflow: hidden;
        background: #f5f5f5;
      }

      .pwx-rv-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
      }

      .pwx-rv-item:hover .pwx-rv-image {
        transform: scale(1.05);
      }

      .pwx-rv-info {
        padding: 12px;
      }

      .pwx-rv-name {
        display: block;
        font-size: 13px;
        font-weight: 500;
        color: #333;
        margin-bottom: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .pwx-rv-price {
        display: block;
        font-size: 14px;
        font-weight: 600;
        color: var(--pwx-primary-color, #000);
      }

      .pwx-rv-visit-badge {
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(0,0,0,0.6);
        color: #fff;
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 10px;
      }

      /* Empty state */
      .pwx-rv-empty {
        text-align: center;
        padding: 40px 20px;
        color: #666;
      }

      .pwx-rv-empty-icon {
        font-size: 48px;
        margin-bottom: 12px;
        opacity: 0.5;
      }

      /* Slider layout */
      .pwx-rv-slider {
        display: flex;
        gap: 16px;
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        scrollbar-width: none;
        -ms-overflow-style: none;
        padding-bottom: 8px;
      }

      .pwx-rv-slider::-webkit-scrollbar {
        display: none;
      }

      .pwx-rv-slider .pwx-rv-item {
        flex: 0 0 180px;
        scroll-snap-align: start;
      }

      @media (max-width: 640px) {
        .pwx-rv-slider .pwx-rv-item {
          flex: 0 0 140px;
        }
      }
    `;
  }

  /**
   * Render the widget
   */
  async render() {
    // Get products from tracker
    const products = this._getProducts();

    // Check if we have enough products
    if (products.length < this.options.minProducts) {
      if (this.options.hideIfEmpty) {
        this.container.style.display = 'none';
        logger.debug(`RecentlyViewed ${this.id}: Hidden (no products)`);
        return;
      }

      // Show empty state
      this.container.innerHTML = this._renderEmptyState();
      this.state.rendered = true;
      return;
    }

    // Make sure container is visible
    this.container.style.display = '';

    // Prepare products with formatted prices
    const formattedProducts = products.map(p => ({
      ...p,
      formattedPrice: this.formatPrice(p.price)
    }));

    // Render
    const html = this._renderProducts(formattedProducts);
    this.container.innerHTML = html;

    this.state.rendered = true;
    this.emit('render', {
      id: this.id,
      productCount: products.length
    });

    logger.debug(`RecentlyViewed ${this.id}: Rendered ${products.length} products`);
  }

  /**
   * Get products from tracker
   * @private
   * @returns {Array}
   */
  _getProducts() {
    if (!this.tracker) {
      // Fallback: try to get from global
      if (typeof window !== 'undefined' && window.PWX && window.PWX.tracker) {
        this.tracker = window.PWX.tracker;
      }
    }

    if (!this.tracker) {
      logger.debug('RecentlyViewed: No tracker available');
      return [];
    }

    const limit = this.options.limit || 6;

    // Exclude current product if on product page
    if (this.options.excludeCurrent) {
      const currentProductId = this._getCurrentProductId();
      if (currentProductId) {
        return this.tracker.getRecentlyViewedExcept(currentProductId, limit);
      }
    }

    return this.tracker.getRecentlyViewed(limit);
  }

  /**
   * Get current product ID from page
   * @private
   * @returns {string|null}
   */
  _getCurrentProductId() {
    // Try various methods to detect current product

    // 1. Global product model (common e-commerce pattern)
    if (typeof window !== 'undefined') {
      if (window.productDetailModel?.productId) {
        return String(window.productDetailModel.productId);
      }
      if (window.product?.id) {
        return String(window.product.id);
      }
      if (window.productId) {
        return String(window.productId);
      }
    }

    // 2. Data attribute on page
    const productEl = document.querySelector('[data-product-id]');
    if (productEl) {
      return productEl.dataset.productId;
    }

    // 3. Meta tag
    const metaProductId = document.querySelector('meta[property="product:id"]');
    if (metaProductId) {
      return metaProductId.getAttribute('content');
    }

    // 4. JSON-LD structured data
    try {
      const jsonLd = document.querySelector('script[type="application/ld+json"]');
      if (jsonLd) {
        const data = JSON.parse(jsonLd.textContent);
        if (data['@type'] === 'Product') {
          return data.sku || data.productID || null;
        }
      }
    } catch (e) {
      // Ignore parse errors
    }

    return null;
  }

  /**
   * Render products HTML
   * @private
   * @param {Array} products
   * @returns {string}
   */
  _renderProducts(products) {
    const title = this.options.title || 'Son Goruntulediginiz Urunler';
    const layout = this.options.layout || 'grid';
    const showVisitCount = this.options.showVisitCount;

    const productItems = products.map(p => `
      <a href="${escapeHtml(p.url || '#')}"
         class="pwx-rv-item"
         data-product-id="${escapeHtml(p.id)}"
         target="_blank"
         rel="noopener noreferrer">
        <div class="pwx-rv-image-wrapper">
          <img src="${escapeHtml(p.image || '')}"
               alt="${escapeHtml(p.title || '')}"
               loading="lazy"
               class="pwx-rv-image">
          ${showVisitCount && p.visitCount > 1 ? `
            <span class="pwx-rv-visit-badge">${p.visitCount}x</span>
          ` : ''}
        </div>
        <div class="pwx-rv-info">
          <span class="pwx-rv-name" title="${escapeHtml(p.title || '')}">${escapeHtml(p.title || '')}</span>
          <span class="pwx-rv-price">${p.formattedPrice}</span>
        </div>
      </a>
    `).join('');

    const gridClass = layout === 'slider' ? 'pwx-rv-slider' : 'pwx-rv-grid';

    return `
      <div class="pwx-rv-container">
        <div class="pwx-rv-header">
          <h3 class="pwx-rv-title">${escapeHtml(title)}</h3>
        </div>
        <div class="${gridClass}">
          ${productItems}
        </div>
      </div>
    `;
  }

  /**
   * Render empty state
   * @private
   * @returns {string}
   */
  _renderEmptyState() {
    return `
      <div class="pwx-rv-container">
        <div class="pwx-rv-empty">
          <div class="pwx-rv-empty-icon">&#128065;</div>
          <p>Henuz goruntulediginiz urun bulunmuyor</p>
        </div>
      </div>
    `;
  }

  /**
   * Refresh widget data
   */
  async refresh() {
    await this.render();
    this.emit('refresh', { id: this.id });
  }

  /**
   * Clear viewing history
   */
  clearHistory() {
    if (this.tracker) {
      this.tracker.products.clearJourney();
      this.render();
    }
  }

  /**
   * Update widget options
   * @param {Object} options
   */
  updateOptions(options) {
    this.options = { ...this.options, ...options };
    this.render();
  }

  /**
   * Handle window resize
   */
  onResize() {
    // Could adjust layout here if needed
  }

  /**
   * Destroy widget
   */
  destroy() {
    this.tracker = null;
    super.destroy();
  }
}

export default RecentlyViewedWidget;
export { RecentlyViewedWidget };
