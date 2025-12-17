/**
 * Popup Widget
 * Modal popup for product promotions
 *
 * @module widgets/popup
 */

import BaseWidget from './BaseWidget.js';
import { createElement, storage } from '../core/utils.js';

/**
 * Popup Widget
 * Displays products in a modal popup
 */
class PopupWidget extends BaseWidget {
  /**
   * Widget type identifier
   */
  static type = 'popup';

  /**
   * Default options
   */
  static defaultOptions = {
    ...BaseWidget.defaultOptions,
    // Trigger
    trigger: 'auto', // auto, scroll, exit, click, delay
    triggerDelay: 3000, // ms for delay trigger
    triggerScrollPercent: 50, // % for scroll trigger
    triggerSelector: null, // selector for click trigger

    // Display
    position: 'center', // center, bottom-right, bottom-left
    size: 'medium', // small, medium, large
    maxProducts: 4,

    // Behavior
    showOnce: true, // Only show once per session
    dismissOnClickOutside: true,
    showCloseButton: true,
    escapeToClose: true,

    // Animation
    animationType: 'fade', // fade, slide, zoom
    animationDuration: 300,

    // Storage key for tracking
    storageKey: 'pwx_popup_shown'
  };

  /**
   * Constructor
   */
  constructor(params) {
    super(params);

    this.isOpen = false;
    this.hasTriggered = false;
  }

  /**
   * Hook before init
   */
  async beforeInit() {
    // Check if already shown
    if (this.options.showOnce) {
      const shown = storage.get(this.options.storageKey);
      if (shown) {
        this.log('Popup already shown, skipping');
        return;
      }
    }
  }

  /**
   * Get widget styles
   */
  getStyles() {
    return `
      ${super.getStyles()}

      /* Popup Overlay */
      .${this.cssPrefix}-popup-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        visibility: hidden;
        transition: opacity var(--popup-duration, 300ms) ease, visibility var(--popup-duration, 300ms) ease;
      }

      .${this.cssPrefix}-popup-overlay--open {
        opacity: 1;
        visibility: visible;
      }

      .${this.cssPrefix}-popup-overlay--bottom-right {
        align-items: flex-end;
        justify-content: flex-end;
        padding: 20px;
      }

      .${this.cssPrefix}-popup-overlay--bottom-left {
        align-items: flex-end;
        justify-content: flex-start;
        padding: 20px;
      }

      /* Popup Modal */
      .${this.cssPrefix}-popup {
        background: #fff;
        border-radius: var(--pwx-border-radius, 12px);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        max-width: 90vw;
        max-height: 90vh;
        overflow: hidden;
        transform: scale(0.9);
        transition: transform var(--popup-duration, 300ms) ease;
        position: relative;
      }

      .${this.cssPrefix}-popup-overlay--open .${this.cssPrefix}-popup {
        transform: scale(1);
      }

      /* Size variants */
      .${this.cssPrefix}-popup--small {
        width: 400px;
      }

      .${this.cssPrefix}-popup--medium {
        width: 600px;
      }

      .${this.cssPrefix}-popup--large {
        width: 800px;
      }

      /* Animation variants */
      .${this.cssPrefix}-popup--slide {
        transform: translateY(100%);
      }

      .${this.cssPrefix}-popup-overlay--open .${this.cssPrefix}-popup--slide {
        transform: translateY(0);
      }

      .${this.cssPrefix}-popup--zoom {
        transform: scale(0);
      }

      .${this.cssPrefix}-popup-overlay--open .${this.cssPrefix}-popup--zoom {
        transform: scale(1);
      }

      /* Close button */
      .${this.cssPrefix}-popup__close {
        position: absolute;
        top: 12px;
        right: 12px;
        width: 32px;
        height: 32px;
        background: #f5f5f5;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        transition: all 0.2s ease;
      }

      .${this.cssPrefix}-popup__close:hover {
        background: #e0e0e0;
      }

      .${this.cssPrefix}-popup__close-icon {
        width: 16px;
        height: 16px;
        stroke: #666;
        stroke-width: 2;
      }

      /* Header */
      .${this.cssPrefix}-popup__header {
        padding: 20px 24px;
        border-bottom: 1px solid #eee;
      }

      .${this.cssPrefix}-popup__title {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: #333;
      }

      .${this.cssPrefix}-popup__subtitle {
        margin: 8px 0 0;
        font-size: 14px;
        color: #666;
      }

      /* Content */
      .${this.cssPrefix}-popup__content {
        padding: 20px 24px;
        overflow-y: auto;
        max-height: calc(90vh - 200px);
      }

      /* Products Grid */
      .${this.cssPrefix}-popup__products {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }

      .${this.cssPrefix}-popup--small .${this.cssPrefix}-popup__products {
        grid-template-columns: 1fr;
      }

      /* Footer */
      .${this.cssPrefix}-popup__footer {
        padding: 16px 24px;
        border-top: 1px solid #eee;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }

      .${this.cssPrefix}-popup__btn {
        padding: 10px 24px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        border: none;
      }

      .${this.cssPrefix}-popup__btn--primary {
        background: var(--pwx-primary-color, #007bff);
        color: #fff;
      }

      .${this.cssPrefix}-popup__btn--primary:hover {
        opacity: 0.9;
      }

      .${this.cssPrefix}-popup__btn--secondary {
        background: #f5f5f5;
        color: #333;
      }

      .${this.cssPrefix}-popup__btn--secondary:hover {
        background: #e0e0e0;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .${this.cssPrefix}-popup {
          width: 100% !important;
          max-width: 100vw;
          max-height: 100vh;
          border-radius: 0;
        }

        .${this.cssPrefix}-popup-overlay {
          padding: 0;
        }

        .${this.cssPrefix}-popup-overlay--bottom-right,
        .${this.cssPrefix}-popup-overlay--bottom-left {
          padding: 0;
        }

        .${this.cssPrefix}-popup__products {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `;
  }

  /**
   * Render the popup
   */
  async render() {
    const {
      position,
      size,
      animationType,
      animationDuration,
      showCloseButton,
      maxProducts
    } = this.options;

    // Don't render if already shown
    if (this.options.showOnce && storage.get(this.options.storageKey)) {
      return;
    }

    // Clear container (this is a hidden placeholder)
    this.container.style.display = 'none';

    // Set CSS variable
    document.documentElement.style.setProperty('--popup-duration', `${animationDuration}ms`);

    // Create overlay
    const overlay = createElement('div', {
      className: `${this.cssPrefix}-popup-overlay ${this.cssPrefix}-popup-overlay--${position}`
    });

    // Create modal
    const modal = createElement('div', {
      className: `${this.cssPrefix}-popup ${this.cssPrefix}-popup--${size} ${this.cssPrefix}-popup--${animationType}`
    });

    // Close button
    if (showCloseButton) {
      const closeBtn = this._createCloseButton();
      modal.appendChild(closeBtn);
    }

    // Header
    const header = createElement('div', {
      className: `${this.cssPrefix}-popup__header`
    });

    const title = createElement('h2', {
      className: `${this.cssPrefix}-popup__title`
    }, this.options.title || 'Özel Teklifler');

    header.appendChild(title);

    if (this.options.subtitle) {
      const subtitle = createElement('p', {
        className: `${this.cssPrefix}-popup__subtitle`
      }, this.options.subtitle);
      header.appendChild(subtitle);
    }

    modal.appendChild(header);

    // Content
    const content = createElement('div', {
      className: `${this.cssPrefix}-popup__content`
    });

    const productsGrid = createElement('div', {
      className: `${this.cssPrefix}-popup__products`
    });

    // Add products
    const products = this.products.slice(0, maxProducts);
    products.forEach(product => {
      productsGrid.appendChild(this.createProductCard(product));
    });

    content.appendChild(productsGrid);
    modal.appendChild(content);

    // Footer
    const footer = createElement('div', {
      className: `${this.cssPrefix}-popup__footer`
    });

    const dismissBtn = createElement('button', {
      className: `${this.cssPrefix}-popup__btn ${this.cssPrefix}-popup__btn--secondary`,
      onClick: () => this.close()
    }, 'Kapat');

    footer.appendChild(dismissBtn);
    modal.appendChild(footer);

    overlay.appendChild(modal);

    // Store references
    this.elements.overlay = overlay;
    this.elements.modal = modal;

    // Append to body
    document.body.appendChild(overlay);

    // Setup trigger
    this._setupTrigger();

    this.state.rendered = true;
  }

  /**
   * Create close button
   */
  _createCloseButton() {
    const button = createElement('button', {
      className: `${this.cssPrefix}-popup__close`,
      'aria-label': 'Kapat',
      onClick: () => this.close()
    });

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', `${this.cssPrefix}-popup__close-icon`);
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');

    const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line1.setAttribute('x1', '18');
    line1.setAttribute('y1', '6');
    line1.setAttribute('x2', '6');
    line1.setAttribute('y2', '18');

    const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line2.setAttribute('x1', '6');
    line2.setAttribute('y1', '6');
    line2.setAttribute('x2', '18');
    line2.setAttribute('y2', '18');

    svg.appendChild(line1);
    svg.appendChild(line2);
    button.appendChild(svg);

    return button;
  }

  /**
   * Setup trigger mechanism
   */
  _setupTrigger() {
    const { trigger, triggerDelay, triggerScrollPercent, triggerSelector } = this.options;

    switch (trigger) {
      case 'auto':
      case 'delay':
        setTimeout(() => this.open(), triggerDelay);
        break;

      case 'scroll':
        this._addListener(window, 'scroll', () => {
          if (this.hasTriggered) return;

          const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
          if (scrollPercent >= triggerScrollPercent) {
            this.hasTriggered = true;
            this.open();
          }
        }, { passive: true });
        break;

      case 'exit':
        this._addListener(document, 'mouseout', (e) => {
          if (this.hasTriggered) return;

          if (e.clientY <= 0) {
            this.hasTriggered = true;
            this.open();
          }
        });
        break;

      case 'click':
        if (triggerSelector) {
          const triggers = document.querySelectorAll(triggerSelector);
          triggers.forEach(el => {
            this._addListener(el, 'click', (e) => {
              e.preventDefault();
              this.open();
            });
          });
        }
        break;
    }
  }

  /**
   * Bind events
   */
  _bindEvents() {
    super._bindEvents();

    // Escape key
    if (this.options.escapeToClose) {
      this._addListener(document, 'keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      });
    }

    // Click outside
    if (this.options.dismissOnClickOutside && this.elements.overlay) {
      this._addListener(this.elements.overlay, 'click', (e) => {
        if (e.target === this.elements.overlay) {
          this.close();
        }
      });
    }
  }

  /**
   * Open the popup
   */
  open() {
    if (this.isOpen || !this.elements.overlay) return;

    // Check if already shown
    if (this.options.showOnce && storage.get(this.options.storageKey)) {
      return;
    }

    this.isOpen = true;
    this.elements.overlay.classList.add(`${this.cssPrefix}-popup-overlay--open`);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Mark as shown
    if (this.options.showOnce) {
      storage.set(this.options.storageKey, true);
    }

    this.emit('popup:open', { id: this.id });
    this.log('Popup opened');
  }

  /**
   * Close the popup
   */
  close() {
    if (!this.isOpen || !this.elements.overlay) return;

    this.isOpen = false;
    this.elements.overlay.classList.remove(`${this.cssPrefix}-popup-overlay--open`);

    // Restore body scroll
    document.body.style.overflow = '';

    this.emit('popup:close', { id: this.id });
    this.log('Popup closed');
  }

  /**
   * Toggle popup
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Destroy the widget
   */
  destroy() {
    this.close();

    // Remove overlay from body
    if (this.elements.overlay && this.elements.overlay.parentNode) {
      this.elements.overlay.parentNode.removeChild(this.elements.overlay);
    }

    super.destroy();
  }
}

export default PopupWidget;
export { PopupWidget };
