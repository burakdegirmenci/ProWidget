/**
 * Banner Widget
 * Hero banner with featured products
 *
 * @module widgets/banner
 */

import BaseWidget from './BaseWidget.js';
import { createElement } from '../core/utils.js';

/**
 * Banner Widget
 * Displays featured products in a hero banner format
 */
class BannerWidget extends BaseWidget {
  /**
   * Widget type identifier
   */
  static type = 'banner';

  /**
   * Default options
   */
  static defaultOptions = {
    ...BaseWidget.defaultOptions,
    // Layout
    layout: 'horizontal', // horizontal, vertical, hero
    maxProducts: 3,
    height: 'auto',

    // Content
    showDescription: true,
    showCTA: true,
    ctaText: 'Ürünü İncele',

    // Styling
    backgroundColor: '#f8f9fa',
    textColor: '#333',
    overlayEnabled: false,
    overlayColor: 'rgba(0, 0, 0, 0.4)'
  };

  /**
   * Get widget styles
   */
  getStyles() {
    return `
      ${super.getStyles()}

      /* Banner Styles */
      .${this.cssPrefix}-banner {
        background: var(--banner-bg, #f8f9fa);
        border-radius: var(--pwx-border-radius, 8px);
        overflow: hidden;
        min-height: var(--banner-height, auto);
      }

      /* Horizontal Layout */
      .${this.cssPrefix}-banner--horizontal {
        display: flex;
        align-items: stretch;
      }

      .${this.cssPrefix}-banner--horizontal .${this.cssPrefix}-banner__products {
        display: flex;
        flex: 1;
        gap: 16px;
        padding: 16px;
      }

      .${this.cssPrefix}-banner--horizontal .${this.cssPrefix}-banner__item {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }

      .${this.cssPrefix}-banner--horizontal .${this.cssPrefix}-banner__image {
        width: 100px;
        height: 100px;
        object-fit: cover;
        border-radius: 8px;
        flex-shrink: 0;
      }

      /* Vertical Layout */
      .${this.cssPrefix}-banner--vertical {
        display: flex;
        flex-direction: column;
      }

      .${this.cssPrefix}-banner--vertical .${this.cssPrefix}-banner__products {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 16px;
      }

      .${this.cssPrefix}-banner--vertical .${this.cssPrefix}-banner__item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: #fff;
        border-radius: 8px;
      }

      .${this.cssPrefix}-banner--vertical .${this.cssPrefix}-banner__image {
        width: 80px;
        height: 80px;
        object-fit: cover;
        border-radius: 8px;
        flex-shrink: 0;
      }

      /* Hero Layout */
      .${this.cssPrefix}-banner--hero {
        position: relative;
        min-height: 400px;
        display: flex;
        align-items: center;
      }

      .${this.cssPrefix}-banner--hero .${this.cssPrefix}-banner__background {
        position: absolute;
        inset: 0;
        z-index: 0;
      }

      .${this.cssPrefix}-banner--hero .${this.cssPrefix}-banner__background img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .${this.cssPrefix}-banner--hero .${this.cssPrefix}-banner__overlay {
        position: absolute;
        inset: 0;
        background: var(--banner-overlay, rgba(0, 0, 0, 0.4));
        z-index: 1;
      }

      .${this.cssPrefix}-banner--hero .${this.cssPrefix}-banner__content {
        position: relative;
        z-index: 2;
        padding: 40px;
        color: #fff;
        max-width: 600px;
      }

      /* Common Elements */
      .${this.cssPrefix}-banner__info {
        flex: 1;
        min-width: 0;
      }

      .${this.cssPrefix}-banner__title {
        font-size: 16px;
        font-weight: 600;
        color: var(--banner-text, #333);
        margin: 0 0 8px 0;
        line-height: 1.3;
      }

      .${this.cssPrefix}-banner--hero .${this.cssPrefix}-banner__title {
        font-size: 32px;
        color: #fff;
        margin-bottom: 16px;
      }

      .${this.cssPrefix}-banner__description {
        font-size: 14px;
        color: #666;
        margin: 0 0 12px 0;
        line-height: 1.4;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .${this.cssPrefix}-banner--hero .${this.cssPrefix}-banner__description {
        font-size: 16px;
        color: rgba(255, 255, 255, 0.9);
      }

      .${this.cssPrefix}-banner__price {
        font-size: 18px;
        font-weight: 600;
        color: var(--pwx-primary-color, #007bff);
      }

      .${this.cssPrefix}-banner--hero .${this.cssPrefix}-banner__price {
        font-size: 28px;
        color: #fff;
      }

      .${this.cssPrefix}-banner__cta {
        display: inline-block;
        padding: 10px 24px;
        background: var(--pwx-primary-color, #007bff);
        color: #fff;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 500;
        margin-top: 12px;
        transition: all 0.2s ease;
      }

      .${this.cssPrefix}-banner__cta:hover {
        background: var(--pwx-secondary-color, #0056b3);
        transform: translateY(-1px);
      }

      .${this.cssPrefix}-banner__link {
        text-decoration: none;
        color: inherit;
        display: block;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .${this.cssPrefix}-banner--horizontal {
          flex-direction: column;
        }

        .${this.cssPrefix}-banner--horizontal .${this.cssPrefix}-banner__products {
          flex-direction: column;
        }

        .${this.cssPrefix}-banner--hero {
          min-height: 300px;
        }

        .${this.cssPrefix}-banner--hero .${this.cssPrefix}-banner__content {
          padding: 24px;
        }

        .${this.cssPrefix}-banner--hero .${this.cssPrefix}-banner__title {
          font-size: 24px;
        }
      }
    `;
  }

  /**
   * Render the banner
   */
  async render() {
    const {
      layout,
      maxProducts,
      backgroundColor,
      textColor,
      height
    } = this.options;

    // Clear container
    this.container.innerHTML = '';

    // Set CSS variables
    this.container.style.setProperty('--banner-bg', backgroundColor);
    this.container.style.setProperty('--banner-text', textColor);
    if (height !== 'auto') {
      this.container.style.setProperty('--banner-height', height);
    }

    // Create banner wrapper
    const wrapper = createElement('div', {
      className: `${this.cssPrefix}-banner ${this.cssPrefix}-banner--${layout}`
    });

    // Get products (limit to maxProducts)
    const products = this.products.slice(0, maxProducts);

    if (layout === 'hero' && products.length > 0) {
      wrapper.appendChild(this._renderHeroLayout(products[0]));
    } else {
      wrapper.appendChild(this._renderProductList(products, layout));
    }

    this.container.appendChild(wrapper);
    this.elements.wrapper = wrapper;

    this.state.rendered = true;
  }

  /**
   * Render hero layout
   */
  _renderHeroLayout(product) {
    const { overlayEnabled, overlayColor, showDescription, showCTA, ctaText } = this.options;

    const fragment = document.createDocumentFragment();

    // Background image
    if (product.imageLink) {
      const background = createElement('div', {
        className: `${this.cssPrefix}-banner__background`
      });
      const img = createElement('img', {
        src: product.imageLink,
        alt: '',
        loading: 'eager'
      });
      background.appendChild(img);
      fragment.appendChild(background);
    }

    // Overlay
    if (overlayEnabled) {
      const overlay = createElement('div', {
        className: `${this.cssPrefix}-banner__overlay`,
        style: { background: overlayColor }
      });
      fragment.appendChild(overlay);
    }

    // Content
    const content = createElement('div', {
      className: `${this.cssPrefix}-banner__content`
    });

    if (product.title) {
      const title = createElement('h2', {
        className: `${this.cssPrefix}-banner__title`
      }, product.title);
      content.appendChild(title);
    }

    if (showDescription && product.description) {
      const desc = createElement('p', {
        className: `${this.cssPrefix}-banner__description`
      }, product.description);
      content.appendChild(desc);
    }

    const price = product.salePrice || product.price;
    if (price) {
      const priceEl = createElement('div', {
        className: `${this.cssPrefix}-banner__price`
      }, this.formatPrice(price));
      content.appendChild(priceEl);
    }

    if (showCTA && product.link) {
      const cta = createElement('a', {
        className: `${this.cssPrefix}-banner__cta`,
        href: product.link,
        target: '_blank',
        rel: 'noopener noreferrer'
      }, ctaText);
      content.appendChild(cta);
    }

    fragment.appendChild(content);

    return fragment;
  }

  /**
   * Render product list
   */
  _renderProductList(products, layout) {
    const { showDescription, showCTA, ctaText } = this.options;

    const container = createElement('div', {
      className: `${this.cssPrefix}-banner__products`
    });

    products.forEach(product => {
      const item = createElement('div', {
        className: `${this.cssPrefix}-banner__item`,
        dataset: { productId: product.id || product.externalId }
      });

      const link = createElement('a', {
        className: `${this.cssPrefix}-banner__link`,
        href: product.link || '#',
        target: '_blank',
        rel: 'noopener noreferrer'
      });

      // Image
      if (product.imageLink) {
        const img = createElement('img', {
          className: `${this.cssPrefix}-banner__image`,
          src: product.imageLink,
          alt: product.title || '',
          loading: 'lazy'
        });
        link.appendChild(img);
      }

      // Info
      const info = createElement('div', {
        className: `${this.cssPrefix}-banner__info`
      });

      if (product.title) {
        const title = createElement('h3', {
          className: `${this.cssPrefix}-banner__title`
        }, product.title);
        info.appendChild(title);
      }

      if (showDescription && product.description) {
        const desc = createElement('p', {
          className: `${this.cssPrefix}-banner__description`
        }, product.description.substring(0, 100));
        info.appendChild(desc);
      }

      const price = product.salePrice || product.price;
      if (price) {
        const priceEl = createElement('div', {
          className: `${this.cssPrefix}-banner__price`
        }, this.formatPrice(price));
        info.appendChild(priceEl);
      }

      link.appendChild(info);
      item.appendChild(link);
      container.appendChild(item);
    });

    return container;
  }
}

export default BannerWidget;
export { BannerWidget };
