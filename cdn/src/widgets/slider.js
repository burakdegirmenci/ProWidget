/**
 * Slider Widget
 * Full-width product slider with smooth transitions
 *
 * @module widgets/slider
 */

import BaseWidget from './BaseWidget.js';
import { createElement } from '../core/utils.js';

/**
 * Slider Widget
 * Displays products one at a time with smooth transitions
 */
class SliderWidget extends BaseWidget {
  /**
   * Widget type identifier
   */
  static type = 'slider';

  /**
   * Default options
   */
  static defaultOptions = {
    ...BaseWidget.defaultOptions,
    // Layout
    height: '400px',
    showThumbnails: true,
    thumbnailPosition: 'bottom', // bottom, left, right

    // Navigation
    showNavigation: true,
    showCounter: true,

    // Auto-play
    autoPlay: true,
    autoPlayInterval: 5000,
    pauseOnHover: true,

    // Animation
    transition: 'slide', // slide, fade, zoom
    transitionDuration: 500,

    // Content
    showContent: true,
    contentPosition: 'left' // left, center, right, bottom
  };

  /**
   * Constructor
   */
  constructor(params) {
    super(params);

    this.currentIndex = 0;
    this.isAnimating = false;
    this.autoPlayTimer = null;
  }

  /**
   * Get widget styles
   */
  getStyles() {
    return `
      ${super.getStyles()}

      /* Slider Container */
      .${this.cssPrefix}-slider {
        position: relative;
        width: 100%;
        height: var(--slider-height, 400px);
        overflow: hidden;
        background: #f8f9fa;
        border-radius: var(--pwx-border-radius, 8px);
      }

      /* Slides Container */
      .${this.cssPrefix}-slider__slides {
        position: relative;
        width: 100%;
        height: 100%;
      }

      /* Individual Slide */
      .${this.cssPrefix}-slider__slide {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        visibility: hidden;
        transition: opacity var(--slider-duration, 500ms) ease, transform var(--slider-duration, 500ms) ease;
      }

      .${this.cssPrefix}-slider__slide--active {
        opacity: 1;
        visibility: visible;
        z-index: 1;
      }

      /* Slide Transition Types */
      .${this.cssPrefix}-slider--slide .${this.cssPrefix}-slider__slide {
        transform: translateX(100%);
      }

      .${this.cssPrefix}-slider--slide .${this.cssPrefix}-slider__slide--active {
        transform: translateX(0);
      }

      .${this.cssPrefix}-slider--slide .${this.cssPrefix}-slider__slide--prev {
        transform: translateX(-100%);
      }

      .${this.cssPrefix}-slider--fade .${this.cssPrefix}-slider__slide {
        transform: none;
      }

      .${this.cssPrefix}-slider--zoom .${this.cssPrefix}-slider__slide {
        transform: scale(1.1);
      }

      .${this.cssPrefix}-slider--zoom .${this.cssPrefix}-slider__slide--active {
        transform: scale(1);
      }

      /* Slide Background */
      .${this.cssPrefix}-slider__background {
        position: absolute;
        inset: 0;
        z-index: 0;
      }

      .${this.cssPrefix}-slider__background img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .${this.cssPrefix}-slider__overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(90deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%);
      }

      /* Slide Content */
      .${this.cssPrefix}-slider__content {
        position: relative;
        z-index: 2;
        height: 100%;
        display: flex;
        align-items: center;
        padding: 40px;
        color: #fff;
      }

      .${this.cssPrefix}-slider__content--center {
        justify-content: center;
        text-align: center;
      }

      .${this.cssPrefix}-slider__content--right {
        justify-content: flex-end;
        text-align: right;
      }

      .${this.cssPrefix}-slider__content--bottom {
        align-items: flex-end;
        padding-bottom: 60px;
      }

      .${this.cssPrefix}-slider__info {
        max-width: 500px;
      }

      .${this.cssPrefix}-slider__title {
        font-size: 32px;
        font-weight: 700;
        margin: 0 0 16px 0;
        line-height: 1.2;
      }

      .${this.cssPrefix}-slider__description {
        font-size: 16px;
        margin: 0 0 20px 0;
        opacity: 0.9;
        line-height: 1.5;
      }

      .${this.cssPrefix}-slider__price {
        font-size: 28px;
        font-weight: 600;
        margin-bottom: 20px;
      }

      .${this.cssPrefix}-slider__cta {
        display: inline-block;
        padding: 14px 32px;
        background: var(--pwx-primary-color, #007bff);
        color: #fff;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 600;
        font-size: 16px;
        transition: all 0.2s ease;
      }

      .${this.cssPrefix}-slider__cta:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }

      /* Navigation */
      .${this.cssPrefix}-slider__nav {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 48px;
        height: 48px;
        background: rgba(255, 255, 255, 0.9);
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        transition: all 0.2s ease;
      }

      .${this.cssPrefix}-slider__nav:hover {
        background: #fff;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .${this.cssPrefix}-slider__nav--prev {
        left: 16px;
      }

      .${this.cssPrefix}-slider__nav--next {
        right: 16px;
      }

      .${this.cssPrefix}-slider__nav-icon {
        width: 24px;
        height: 24px;
        stroke: #333;
        stroke-width: 2;
        fill: none;
      }

      /* Counter */
      .${this.cssPrefix}-slider__counter {
        position: absolute;
        bottom: 16px;
        right: 16px;
        background: rgba(0, 0, 0, 0.6);
        color: #fff;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10;
      }

      /* Thumbnails */
      .${this.cssPrefix}-slider__thumbnails {
        display: flex;
        gap: 8px;
        padding: 12px;
        background: #fff;
      }

      .${this.cssPrefix}-slider__thumbnails--bottom {
        justify-content: center;
      }

      .${this.cssPrefix}-slider__thumbnail {
        width: 60px;
        height: 60px;
        border-radius: 6px;
        overflow: hidden;
        cursor: pointer;
        opacity: 0.6;
        transition: all 0.2s ease;
        border: 2px solid transparent;
      }

      .${this.cssPrefix}-slider__thumbnail:hover {
        opacity: 0.8;
      }

      .${this.cssPrefix}-slider__thumbnail--active {
        opacity: 1;
        border-color: var(--pwx-primary-color, #007bff);
      }

      .${this.cssPrefix}-slider__thumbnail img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      /* Progress bar */
      .${this.cssPrefix}-slider__progress {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: rgba(255, 255, 255, 0.3);
        z-index: 10;
      }

      .${this.cssPrefix}-slider__progress-bar {
        height: 100%;
        background: var(--pwx-primary-color, #007bff);
        width: 0;
        transition: width linear;
      }

      .${this.cssPrefix}-slider__progress-bar--active {
        animation: pwx-slider-progress var(--slider-interval, 5000ms) linear;
      }

      @keyframes pwx-slider-progress {
        from { width: 0; }
        to { width: 100%; }
      }

      /* Responsive */
      @media (max-width: 768px) {
        .${this.cssPrefix}-slider {
          height: 300px;
        }

        .${this.cssPrefix}-slider__content {
          padding: 24px;
        }

        .${this.cssPrefix}-slider__title {
          font-size: 24px;
        }

        .${this.cssPrefix}-slider__description {
          font-size: 14px;
        }

        .${this.cssPrefix}-slider__nav {
          width: 40px;
          height: 40px;
        }

        .${this.cssPrefix}-slider__nav--prev {
          left: 8px;
        }

        .${this.cssPrefix}-slider__nav--next {
          right: 8px;
        }
      }
    `;
  }

  /**
   * Render the slider
   */
  async render() {
    const {
      height,
      showThumbnails,
      thumbnailPosition,
      showNavigation,
      showCounter,
      transition,
      transitionDuration,
      autoPlayInterval
    } = this.options;

    // Clear container
    this.container.innerHTML = '';

    // Set CSS variables
    this.container.style.setProperty('--slider-height', height);
    this.container.style.setProperty('--slider-duration', `${transitionDuration}ms`);
    this.container.style.setProperty('--slider-interval', `${autoPlayInterval}ms`);

    // Create main wrapper
    const wrapper = createElement('div', {
      className: `${this.cssPrefix}-slider-wrapper`
    });

    // Create slider container
    const slider = createElement('div', {
      className: `${this.cssPrefix}-slider ${this.cssPrefix}-slider--${transition}`
    });

    // Slides container
    const slidesContainer = createElement('div', {
      className: `${this.cssPrefix}-slider__slides`
    });

    // Create slides
    this.products.forEach((product, index) => {
      const slide = this._createSlide(product, index);
      slidesContainer.appendChild(slide);
    });

    slider.appendChild(slidesContainer);

    // Navigation
    if (showNavigation && this.products.length > 1) {
      slider.appendChild(this._createNavButton('prev'));
      slider.appendChild(this._createNavButton('next'));
    }

    // Counter
    if (showCounter && this.products.length > 1) {
      const counter = createElement('div', {
        className: `${this.cssPrefix}-slider__counter`
      }, `1 / ${this.products.length}`);
      this.elements.counter = counter;
      slider.appendChild(counter);
    }

    // Progress bar for auto-play
    if (this.options.autoPlay && this.products.length > 1) {
      const progress = createElement('div', {
        className: `${this.cssPrefix}-slider__progress`
      });
      const progressBar = createElement('div', {
        className: `${this.cssPrefix}-slider__progress-bar ${this.cssPrefix}-slider__progress-bar--active`
      });
      progress.appendChild(progressBar);
      slider.appendChild(progress);
      this.elements.progressBar = progressBar;
    }

    wrapper.appendChild(slider);

    // Thumbnails
    if (showThumbnails && this.products.length > 1) {
      const thumbnails = this._createThumbnails();
      wrapper.appendChild(thumbnails);
    }

    this.container.appendChild(wrapper);

    // Store references
    this.elements.wrapper = wrapper;
    this.elements.slider = slider;
    this.elements.slides = slidesContainer.querySelectorAll(`.${this.cssPrefix}-slider__slide`);

    // Set initial active slide
    this._setActiveSlide(0);

    // Start auto-play
    if (this.options.autoPlay) {
      this._startAutoPlay();
    }

    this.state.rendered = true;
  }

  /**
   * Create a slide
   */
  _createSlide(product, index) {
    const { showContent, contentPosition } = this.options;

    const slide = createElement('div', {
      className: `${this.cssPrefix}-slider__slide`,
      dataset: { index, productId: product.id || product.externalId }
    });

    // Background
    if (product.imageLink) {
      const background = createElement('div', {
        className: `${this.cssPrefix}-slider__background`
      });
      const img = createElement('img', {
        src: product.imageLink,
        alt: product.title || '',
        loading: index === 0 ? 'eager' : 'lazy'
      });
      background.appendChild(img);

      // Overlay
      const overlay = createElement('div', {
        className: `${this.cssPrefix}-slider__overlay`
      });
      background.appendChild(overlay);

      slide.appendChild(background);
    }

    // Content
    if (showContent) {
      const content = createElement('div', {
        className: `${this.cssPrefix}-slider__content ${this.cssPrefix}-slider__content--${contentPosition}`
      });

      const info = createElement('div', {
        className: `${this.cssPrefix}-slider__info`
      });

      if (product.title) {
        const title = createElement('h2', {
          className: `${this.cssPrefix}-slider__title`
        }, product.title);
        info.appendChild(title);
      }

      if (product.description) {
        const desc = createElement('p', {
          className: `${this.cssPrefix}-slider__description`
        }, product.description.substring(0, 150));
        info.appendChild(desc);
      }

      const price = product.salePrice || product.price;
      if (price) {
        const priceEl = createElement('div', {
          className: `${this.cssPrefix}-slider__price`
        }, this.formatPrice(price));
        info.appendChild(priceEl);
      }

      if (product.link) {
        const cta = createElement('a', {
          className: `${this.cssPrefix}-slider__cta`,
          href: product.link,
          target: '_blank',
          rel: 'noopener noreferrer'
        }, 'Ürünü İncele');
        info.appendChild(cta);
      }

      content.appendChild(info);
      slide.appendChild(content);
    }

    return slide;
  }

  /**
   * Create navigation button
   */
  _createNavButton(direction) {
    const isNext = direction === 'next';
    const button = createElement('button', {
      className: `${this.cssPrefix}-slider__nav ${this.cssPrefix}-slider__nav--${direction}`,
      'aria-label': isNext ? 'Sonraki' : 'Önceki',
      onClick: () => isNext ? this.next() : this.prev()
    });

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', `${this.cssPrefix}-slider__nav-icon`);
    svg.setAttribute('viewBox', '0 0 24 24');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    path.setAttribute('points', isNext ? '9 18 15 12 9 6' : '15 18 9 12 15 6');

    svg.appendChild(path);
    button.appendChild(svg);

    return button;
  }

  /**
   * Create thumbnails
   */
  _createThumbnails() {
    const container = createElement('div', {
      className: `${this.cssPrefix}-slider__thumbnails ${this.cssPrefix}-slider__thumbnails--${this.options.thumbnailPosition}`
    });

    this.products.forEach((product, index) => {
      const thumb = createElement('div', {
        className: `${this.cssPrefix}-slider__thumbnail ${index === 0 ? `${this.cssPrefix}-slider__thumbnail--active` : ''}`,
        dataset: { index },
        onClick: () => this.goTo(index)
      });

      if (product.imageLink) {
        const img = createElement('img', {
          src: product.imageLink,
          alt: product.title || '',
          loading: 'lazy'
        });
        thumb.appendChild(img);
      }

      container.appendChild(thumb);
    });

    this.elements.thumbnails = container;

    return container;
  }

  /**
   * Set active slide
   */
  _setActiveSlide(index) {
    if (!this.elements.slides) return;

    // Update slides
    this.elements.slides.forEach((slide, i) => {
      slide.classList.remove(
        `${this.cssPrefix}-slider__slide--active`,
        `${this.cssPrefix}-slider__slide--prev`
      );

      if (i === index) {
        slide.classList.add(`${this.cssPrefix}-slider__slide--active`);
      } else if (i === this.currentIndex) {
        slide.classList.add(`${this.cssPrefix}-slider__slide--prev`);
      }
    });

    // Update thumbnails
    if (this.elements.thumbnails) {
      const thumbs = this.elements.thumbnails.querySelectorAll(`.${this.cssPrefix}-slider__thumbnail`);
      thumbs.forEach((thumb, i) => {
        thumb.classList.toggle(`${this.cssPrefix}-slider__thumbnail--active`, i === index);
      });
    }

    // Update counter
    if (this.elements.counter) {
      this.elements.counter.textContent = `${index + 1} / ${this.products.length}`;
    }

    // Reset progress bar
    if (this.elements.progressBar) {
      this.elements.progressBar.classList.remove(`${this.cssPrefix}-slider__progress-bar--active`);
      void this.elements.progressBar.offsetWidth; // Force reflow
      this.elements.progressBar.classList.add(`${this.cssPrefix}-slider__progress-bar--active`);
    }

    this.currentIndex = index;
  }

  /**
   * Go to specific slide
   */
  goTo(index) {
    if (this.isAnimating || index === this.currentIndex) return;

    // Handle wrap around
    if (index < 0) {
      index = this.products.length - 1;
    } else if (index >= this.products.length) {
      index = 0;
    }

    this.isAnimating = true;
    this._setActiveSlide(index);

    // Reset auto-play timer
    if (this.options.autoPlay) {
      this._stopAutoPlay();
      this._startAutoPlay();
    }

    setTimeout(() => {
      this.isAnimating = false;
    }, this.options.transitionDuration);

    this.emit('slide:change', { index });
  }

  /**
   * Go to next slide
   */
  next() {
    this.goTo(this.currentIndex + 1);
  }

  /**
   * Go to previous slide
   */
  prev() {
    this.goTo(this.currentIndex - 1);
  }

  /**
   * Start auto-play
   */
  _startAutoPlay() {
    if (this.autoPlayTimer || this.products.length <= 1) return;

    this.autoPlayTimer = setInterval(() => {
      this.next();
    }, this.options.autoPlayInterval);
  }

  /**
   * Stop auto-play
   */
  _stopAutoPlay() {
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
  }

  /**
   * Bind events
   */
  _bindEvents() {
    super._bindEvents();

    // Pause on hover
    if (this.options.pauseOnHover && this.options.autoPlay) {
      this._addListener(this.container, 'mouseenter', () => {
        this._stopAutoPlay();
        if (this.elements.progressBar) {
          this.elements.progressBar.style.animationPlayState = 'paused';
        }
      });

      this._addListener(this.container, 'mouseleave', () => {
        this._startAutoPlay();
        if (this.elements.progressBar) {
          this.elements.progressBar.style.animationPlayState = 'running';
        }
      });
    }

    // Touch/swipe support
    let touchStartX = 0;
    let touchEndX = 0;

    this._addListener(this.container, 'touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    this._addListener(this.container, 'touchend', (e) => {
      touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX - touchEndX;

      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          this.next();
        } else {
          this.prev();
        }
      }
    }, { passive: true });

    // Keyboard navigation
    this._addListener(document, 'keydown', (e) => {
      if (!this.container.matches(':hover')) return;

      if (e.key === 'ArrowLeft') {
        this.prev();
      } else if (e.key === 'ArrowRight') {
        this.next();
      }
    });
  }

  /**
   * Destroy widget
   */
  destroy() {
    this._stopAutoPlay();
    super.destroy();
  }
}

export default SliderWidget;
export { SliderWidget };
