/**
 * Carousel Widget
 * Product carousel with navigation and auto-play
 *
 * @module widgets/carousel
 */

import BaseWidget from './BaseWidget.js';
import { createElement, debounce } from '../core/utils.js';

/**
 * Carousel Widget
 * Displays products in a scrollable carousel
 */
class CarouselWidget extends BaseWidget {
  /**
   * Widget type identifier
   */
  static type = 'carousel';

  /**
   * Default options
   */
  static defaultOptions = {
    ...BaseWidget.defaultOptions,
    // Layout
    slidesToShow: 4,
    slidesToScroll: 1,
    gap: 16,

    // Navigation
    showNavigation: true,
    showDots: true,

    // Auto-play
    autoPlay: false,
    autoPlayInterval: 5000,
    pauseOnHover: true,

    // Animation
    transitionDuration: 300,
    easing: 'ease-out',

    // Responsive breakpoints
    responsive: [
      { breakpoint: 1200, slidesToShow: 4 },
      { breakpoint: 992, slidesToShow: 3 },
      { breakpoint: 768, slidesToShow: 2 },
      { breakpoint: 480, slidesToShow: 1 }
    ],

    // Infinite loop
    infinite: true
  };

  /**
   * Constructor
   */
  constructor(params) {
    super(params);

    this.currentSlide = 0;
    this.isAnimating = false;
    this.autoPlayTimer = null;
    this.touchStartX = 0;
    this.touchEndX = 0;
  }

  /**
   * Get responsive slides to show based on viewport
   *
   * @returns {number} Number of slides to show
   */
  getSlidesToShow() {
    const width = window.innerWidth;
    const breakpoints = this.options.responsive || [];

    // Sort breakpoints descending
    const sorted = [...breakpoints].sort((a, b) => b.breakpoint - a.breakpoint);

    for (const bp of sorted) {
      if (width <= bp.breakpoint) {
        return bp.slidesToShow || this.options.slidesToShow;
      }
    }

    return this.options.slidesToShow;
  }

  /**
   * Get widget styles
   */
  getStyles() {
    return `
      ${super.getStyles()}

      /* Carousel Styles */
      .${this.cssPrefix}-carousel {
        position: relative;
        overflow: hidden;
      }

      .${this.cssPrefix}-carousel__viewport {
        overflow: hidden;
      }

      .${this.cssPrefix}-carousel__track {
        display: flex;
        transition: transform var(--carousel-duration, 300ms) var(--carousel-easing, ease-out);
        will-change: transform;
      }

      .${this.cssPrefix}-carousel__slide {
        flex-shrink: 0;
        padding: 0 calc(var(--carousel-gap, 16px) / 2);
      }

      .${this.cssPrefix}-carousel__slide:first-child {
        padding-left: 0;
      }

      .${this.cssPrefix}-carousel__slide:last-child {
        padding-right: 0;
      }

      /* Navigation */
      .${this.cssPrefix}-carousel__nav {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 40px;
        height: 40px;
        background: rgba(255, 255, 255, 0.9);
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        transition: all 0.2s ease;
        z-index: 10;
      }

      .${this.cssPrefix}-carousel__nav:hover {
        background: #fff;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }

      .${this.cssPrefix}-carousel__nav:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      .${this.cssPrefix}-carousel__nav--prev {
        left: 8px;
      }

      .${this.cssPrefix}-carousel__nav--next {
        right: 8px;
      }

      .${this.cssPrefix}-carousel__nav-icon {
        width: 20px;
        height: 20px;
        fill: none;
        stroke: #333;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      /* Dots */
      .${this.cssPrefix}-carousel__dots {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin-top: 16px;
      }

      .${this.cssPrefix}-carousel__dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #ddd;
        border: none;
        cursor: pointer;
        padding: 0;
        transition: all 0.2s ease;
      }

      .${this.cssPrefix}-carousel__dot:hover {
        background: #bbb;
      }

      .${this.cssPrefix}-carousel__dot--active {
        background: var(--pwx-primary-color, #007bff);
        transform: scale(1.2);
      }

      /* Touch support */
      .${this.cssPrefix}-carousel--dragging .${this.cssPrefix}-carousel__track {
        transition: none;
      }
    `;
  }

  /**
   * Render the carousel
   */
  async render() {
    const { showNavigation, showDots, transitionDuration, easing, gap } = this.options;

    // Clear container
    this.container.innerHTML = '';

    // Set CSS variables
    this.container.style.setProperty('--carousel-duration', `${transitionDuration}ms`);
    this.container.style.setProperty('--carousel-easing', easing);
    this.container.style.setProperty('--carousel-gap', `${gap}px`);

    // Create structure
    const wrapper = createElement('div', {
      className: `${this.cssPrefix}-carousel`
    });

    // Viewport
    const viewport = createElement('div', {
      className: `${this.cssPrefix}-carousel__viewport`
    });

    // Track
    const track = createElement('div', {
      className: `${this.cssPrefix}-carousel__track`
    });

    // Add slides
    this.products.forEach(product => {
      const slide = createElement('div', {
        className: `${this.cssPrefix}-carousel__slide`
      });
      slide.appendChild(this.createProductCard(product));
      track.appendChild(slide);
    });

    viewport.appendChild(track);
    wrapper.appendChild(viewport);

    // Navigation
    if (showNavigation && this.products.length > this.getSlidesToShow()) {
      wrapper.appendChild(this._createNavButton('prev'));
      wrapper.appendChild(this._createNavButton('next'));
    }

    // Dots
    if (showDots && this.products.length > this.getSlidesToShow()) {
      wrapper.appendChild(this._createDots());
    }

    this.container.appendChild(wrapper);

    // Store references
    this.elements.wrapper = wrapper;
    this.elements.viewport = viewport;
    this.elements.track = track;

    // Set initial slide widths
    this._updateSlideWidths();

    // Start auto-play
    if (this.options.autoPlay) {
      this._startAutoPlay();
    }

    this.state.rendered = true;
  }

  /**
   * Create navigation button
   */
  _createNavButton(direction) {
    const isNext = direction === 'next';
    const button = createElement('button', {
      className: `${this.cssPrefix}-carousel__nav ${this.cssPrefix}-carousel__nav--${direction}`,
      'aria-label': isNext ? 'Next slide' : 'Previous slide',
      onClick: () => isNext ? this.next() : this.prev()
    });

    // SVG icon
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', `${this.cssPrefix}-carousel__nav-icon`);
    svg.setAttribute('viewBox', '0 0 24 24');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    path.setAttribute('points', isNext ? '9 18 15 12 9 6' : '15 18 9 12 15 6');

    svg.appendChild(path);
    button.appendChild(svg);

    this.elements[`${direction}Button`] = button;

    return button;
  }

  /**
   * Create dots navigation
   */
  _createDots() {
    const dotsContainer = createElement('div', {
      className: `${this.cssPrefix}-carousel__dots`
    });

    const totalDots = Math.ceil(this.products.length / this.options.slidesToScroll);

    for (let i = 0; i < totalDots; i++) {
      const dot = createElement('button', {
        className: `${this.cssPrefix}-carousel__dot ${i === 0 ? `${this.cssPrefix}-carousel__dot--active` : ''}`,
        'aria-label': `Go to slide ${i + 1}`,
        onClick: () => this.goTo(i * this.options.slidesToScroll)
      });
      dotsContainer.appendChild(dot);
    }

    this.elements.dots = dotsContainer;

    return dotsContainer;
  }

  /**
   * Update slide widths based on viewport
   */
  _updateSlideWidths() {
    const slidesToShow = this.getSlidesToShow();
    const gap = this.options.gap;
    const slides = this.elements.track?.querySelectorAll(`.${this.cssPrefix}-carousel__slide`);

    if (!slides) return;

    const totalGap = gap * (slidesToShow - 1);
    const slideWidth = `calc((100% - ${totalGap}px) / ${slidesToShow})`;

    slides.forEach(slide => {
      slide.style.width = slideWidth;
    });

    // Update track position
    this._updateTrackPosition();
  }

  /**
   * Update track position
   */
  _updateTrackPosition() {
    if (!this.elements.track) return;

    const slidesToShow = this.getSlidesToShow();
    const gap = this.options.gap;

    // Calculate offset percentage
    const slideWidth = 100 / slidesToShow;
    const gapOffset = (gap * this.currentSlide) / this.elements.viewport.offsetWidth * 100;
    const offset = -(this.currentSlide * slideWidth + gapOffset);

    this.elements.track.style.transform = `translateX(${offset}%)`;
  }

  /**
   * Update dots active state
   */
  _updateDots() {
    if (!this.elements.dots) return;

    const dots = this.elements.dots.querySelectorAll(`.${this.cssPrefix}-carousel__dot`);
    const currentDot = Math.floor(this.currentSlide / this.options.slidesToScroll);

    dots.forEach((dot, index) => {
      dot.classList.toggle(`${this.cssPrefix}-carousel__dot--active`, index === currentDot);
    });
  }

  /**
   * Update navigation buttons state
   */
  _updateNavigation() {
    if (!this.options.infinite) {
      if (this.elements.prevButton) {
        this.elements.prevButton.disabled = this.currentSlide === 0;
      }
      if (this.elements.nextButton) {
        const maxSlide = this.products.length - this.getSlidesToShow();
        this.elements.nextButton.disabled = this.currentSlide >= maxSlide;
      }
    }
  }

  /**
   * Go to specific slide
   */
  goTo(index) {
    if (this.isAnimating) return;

    const maxSlide = this.products.length - this.getSlidesToShow();

    // Handle infinite loop
    if (this.options.infinite) {
      if (index < 0) {
        index = maxSlide;
      } else if (index > maxSlide) {
        index = 0;
      }
    } else {
      index = Math.max(0, Math.min(index, maxSlide));
    }

    if (index === this.currentSlide) return;

    this.isAnimating = true;
    this.currentSlide = index;

    this._updateTrackPosition();
    this._updateDots();
    this._updateNavigation();

    setTimeout(() => {
      this.isAnimating = false;
    }, this.options.transitionDuration);

    this.emit('slide:change', { currentSlide: this.currentSlide });
  }

  /**
   * Go to next slide
   */
  next() {
    this.goTo(this.currentSlide + this.options.slidesToScroll);
  }

  /**
   * Go to previous slide
   */
  prev() {
    this.goTo(this.currentSlide - this.options.slidesToScroll);
  }

  /**
   * Start auto-play
   */
  _startAutoPlay() {
    if (this.autoPlayTimer) return;

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

    // Touch events
    this._addListener(this.container, 'touchstart', (e) => {
      this.touchStartX = e.touches[0].clientX;
      if (this.options.pauseOnHover) {
        this._stopAutoPlay();
      }
    }, { passive: true });

    this._addListener(this.container, 'touchend', (e) => {
      this.touchEndX = e.changedTouches[0].clientX;
      this._handleSwipe();
      if (this.options.autoPlay) {
        this._startAutoPlay();
      }
    }, { passive: true });

    // Mouse events for pause on hover
    if (this.options.pauseOnHover && this.options.autoPlay) {
      this._addListener(this.container, 'mouseenter', () => {
        this._stopAutoPlay();
      });

      this._addListener(this.container, 'mouseleave', () => {
        this._startAutoPlay();
      });
    }
  }

  /**
   * Handle swipe gesture
   */
  _handleSwipe() {
    const diff = this.touchStartX - this.touchEndX;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        this.next();
      } else {
        this.prev();
      }
    }
  }

  /**
   * Handle window resize
   */
  onResize() {
    this._updateSlideWidths();
  }

  /**
   * Destroy widget
   */
  destroy() {
    this._stopAutoPlay();
    super.destroy();
  }
}

export default CarouselWidget;
export { CarouselWidget };
