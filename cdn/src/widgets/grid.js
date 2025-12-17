/**
 * Grid Widget
 * Responsive product grid layout
 *
 * @module widgets/grid
 */

import BaseWidget from './BaseWidget.js';
import { createElement } from '../core/utils.js';

/**
 * Grid Widget
 * Displays products in a responsive grid layout
 */
class GridWidget extends BaseWidget {
  /**
   * Widget type identifier
   */
  static type = 'grid';

  /**
   * Default options
   */
  static defaultOptions = {
    ...BaseWidget.defaultOptions,
    // Grid settings
    columns: 4,
    gap: 16,
    minCardWidth: 200,

    // Pagination
    productsPerPage: 12,
    showPagination: true,
    showLoadMore: false,

    // Responsive columns
    responsive: [
      { breakpoint: 1200, columns: 4 },
      { breakpoint: 992, columns: 3 },
      { breakpoint: 768, columns: 2 },
      { breakpoint: 480, columns: 1 }
    ],

    // Animation
    animateOnLoad: true
  };

  /**
   * Constructor
   */
  constructor(params) {
    super(params);

    this.currentPage = 1;
    this.displayedProducts = [];
  }

  /**
   * Get responsive columns based on viewport
   */
  getColumns() {
    const width = window.innerWidth;
    const breakpoints = this.options.responsive || [];

    const sorted = [...breakpoints].sort((a, b) => b.breakpoint - a.breakpoint);

    for (const bp of sorted) {
      if (width <= bp.breakpoint) {
        return bp.columns || this.options.columns;
      }
    }

    return this.options.columns;
  }

  /**
   * Get widget styles
   */
  getStyles() {
    return `
      ${super.getStyles()}

      /* Grid Styles */
      .${this.cssPrefix}-grid {
        display: grid;
        grid-template-columns: repeat(var(--grid-columns, 4), 1fr);
        gap: var(--grid-gap, 16px);
      }

      .${this.cssPrefix}-grid__item {
        animation: pwx-grid-fade-in 0.3s ease forwards;
        opacity: 0;
      }

      @keyframes pwx-grid-fade-in {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Staggered animation */
      .${this.cssPrefix}-grid__item:nth-child(1) { animation-delay: 0ms; }
      .${this.cssPrefix}-grid__item:nth-child(2) { animation-delay: 50ms; }
      .${this.cssPrefix}-grid__item:nth-child(3) { animation-delay: 100ms; }
      .${this.cssPrefix}-grid__item:nth-child(4) { animation-delay: 150ms; }
      .${this.cssPrefix}-grid__item:nth-child(5) { animation-delay: 200ms; }
      .${this.cssPrefix}-grid__item:nth-child(6) { animation-delay: 250ms; }
      .${this.cssPrefix}-grid__item:nth-child(7) { animation-delay: 300ms; }
      .${this.cssPrefix}-grid__item:nth-child(8) { animation-delay: 350ms; }
      .${this.cssPrefix}-grid__item:nth-child(9) { animation-delay: 400ms; }
      .${this.cssPrefix}-grid__item:nth-child(10) { animation-delay: 450ms; }
      .${this.cssPrefix}-grid__item:nth-child(11) { animation-delay: 500ms; }
      .${this.cssPrefix}-grid__item:nth-child(12) { animation-delay: 550ms; }

      .${this.cssPrefix}-grid--no-animation .${this.cssPrefix}-grid__item {
        animation: none;
        opacity: 1;
      }

      /* Pagination */
      .${this.cssPrefix}-grid__pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
        margin-top: 24px;
        flex-wrap: wrap;
      }

      .${this.cssPrefix}-grid__page-btn {
        min-width: 40px;
        height: 40px;
        padding: 0 12px;
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s ease;
      }

      .${this.cssPrefix}-grid__page-btn:hover:not(:disabled) {
        border-color: var(--pwx-primary-color, #007bff);
        color: var(--pwx-primary-color, #007bff);
      }

      .${this.cssPrefix}-grid__page-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .${this.cssPrefix}-grid__page-btn--active {
        background: var(--pwx-primary-color, #007bff);
        border-color: var(--pwx-primary-color, #007bff);
        color: #fff;
      }

      .${this.cssPrefix}-grid__page-btn--active:hover {
        color: #fff;
      }

      /* Load More */
      .${this.cssPrefix}-grid__load-more {
        display: flex;
        justify-content: center;
        margin-top: 24px;
      }

      .${this.cssPrefix}-grid__load-more-btn {
        padding: 12px 32px;
        background: var(--pwx-primary-color, #007bff);
        color: #fff;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .${this.cssPrefix}-grid__load-more-btn:hover:not(:disabled) {
        opacity: 0.9;
      }

      .${this.cssPrefix}-grid__load-more-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      /* Empty state */
      .${this.cssPrefix}-grid__empty {
        grid-column: 1 / -1;
        text-align: center;
        padding: 40px;
        color: #666;
      }

      .${this.cssPrefix}-grid__empty-icon {
        width: 64px;
        height: 64px;
        margin-bottom: 16px;
        opacity: 0.5;
      }

      /* Info */
      .${this.cssPrefix}-grid__info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        font-size: 14px;
        color: #666;
      }

      .${this.cssPrefix}-grid__count {
        font-weight: 500;
      }
    `;
  }

  /**
   * Render the grid
   */
  async render() {
    const {
      gap,
      productsPerPage,
      showPagination,
      showLoadMore,
      animateOnLoad
    } = this.options;

    // Clear container
    this.container.innerHTML = '';

    const columns = this.getColumns();

    // Set CSS variables
    this.container.style.setProperty('--grid-columns', columns);
    this.container.style.setProperty('--grid-gap', `${gap}px`);

    // Create wrapper
    const wrapper = createElement('div', {
      className: `${this.cssPrefix}-grid-wrapper`
    });

    // Info bar
    if (this.products.length > productsPerPage) {
      const info = createElement('div', {
        className: `${this.cssPrefix}-grid__info`
      });

      const count = createElement('span', {
        className: `${this.cssPrefix}-grid__count`
      }, `${this.products.length} ürün`);

      info.appendChild(count);
      wrapper.appendChild(info);
    }

    // Grid
    const grid = createElement('div', {
      className: `${this.cssPrefix}-grid ${!animateOnLoad ? `${this.cssPrefix}-grid--no-animation` : ''}`
    });

    // Calculate products to display
    const startIndex = (this.currentPage - 1) * productsPerPage;
    const endIndex = showLoadMore
      ? this.currentPage * productsPerPage
      : startIndex + productsPerPage;

    this.displayedProducts = showLoadMore
      ? this.products.slice(0, endIndex)
      : this.products.slice(startIndex, endIndex);

    // Add products
    if (this.displayedProducts.length === 0) {
      grid.appendChild(this._createEmptyState());
    } else {
      this.displayedProducts.forEach(product => {
        const item = createElement('div', {
          className: `${this.cssPrefix}-grid__item`
        });
        item.appendChild(this.createProductCard(product));
        grid.appendChild(item);
      });
    }

    wrapper.appendChild(grid);

    // Pagination or Load More
    const totalPages = Math.ceil(this.products.length / productsPerPage);

    if (showLoadMore && this.displayedProducts.length < this.products.length) {
      wrapper.appendChild(this._createLoadMoreButton());
    } else if (showPagination && totalPages > 1) {
      wrapper.appendChild(this._createPagination(totalPages));
    }

    this.container.appendChild(wrapper);

    // Store references
    this.elements.wrapper = wrapper;
    this.elements.grid = grid;

    this.state.rendered = true;
  }

  /**
   * Create pagination
   */
  _createPagination(totalPages) {
    const pagination = createElement('div', {
      className: `${this.cssPrefix}-grid__pagination`
    });

    // Previous button
    const prevBtn = createElement('button', {
      className: `${this.cssPrefix}-grid__page-btn`,
      disabled: this.currentPage === 1,
      onClick: () => this.goToPage(this.currentPage - 1)
    }, '←');
    pagination.appendChild(prevBtn);

    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      pagination.appendChild(this._createPageButton(1));
      if (startPage > 2) {
        pagination.appendChild(createElement('span', {}, '...'));
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pagination.appendChild(this._createPageButton(i));
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pagination.appendChild(createElement('span', {}, '...'));
      }
      pagination.appendChild(this._createPageButton(totalPages));
    }

    // Next button
    const nextBtn = createElement('button', {
      className: `${this.cssPrefix}-grid__page-btn`,
      disabled: this.currentPage === totalPages,
      onClick: () => this.goToPage(this.currentPage + 1)
    }, '→');
    pagination.appendChild(nextBtn);

    this.elements.pagination = pagination;

    return pagination;
  }

  /**
   * Create page button
   */
  _createPageButton(page) {
    const isActive = page === this.currentPage;
    return createElement('button', {
      className: `${this.cssPrefix}-grid__page-btn ${isActive ? `${this.cssPrefix}-grid__page-btn--active` : ''}`,
      onClick: () => this.goToPage(page)
    }, String(page));
  }

  /**
   * Create load more button
   */
  _createLoadMoreButton() {
    const container = createElement('div', {
      className: `${this.cssPrefix}-grid__load-more`
    });

    const remaining = this.products.length - this.displayedProducts.length;

    const btn = createElement('button', {
      className: `${this.cssPrefix}-grid__load-more-btn`,
      onClick: () => this.loadMore()
    }, `Daha Fazla Göster (${remaining})`);

    container.appendChild(btn);
    this.elements.loadMoreBtn = btn;

    return container;
  }

  /**
   * Create empty state
   */
  _createEmptyState() {
    const empty = createElement('div', {
      className: `${this.cssPrefix}-grid__empty`
    });

    // Icon
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', `${this.cssPrefix}-grid__empty-icon`);
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.5');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4');

    svg.appendChild(path);
    empty.appendChild(svg);

    const text = createElement('p', {}, 'Henüz ürün bulunmuyor');
    empty.appendChild(text);

    return empty;
  }

  /**
   * Go to specific page
   */
  goToPage(page) {
    const totalPages = Math.ceil(this.products.length / this.options.productsPerPage);

    if (page < 1 || page > totalPages || page === this.currentPage) {
      return;
    }

    this.currentPage = page;
    this.render();

    // Scroll to top of widget
    this.container.scrollIntoView({ behavior: 'smooth', block: 'start' });

    this.emit('page:change', { page: this.currentPage });
  }

  /**
   * Load more products
   */
  loadMore() {
    this.currentPage++;
    this.render();

    this.emit('load:more', { page: this.currentPage });
  }

  /**
   * Handle window resize
   */
  onResize() {
    const columns = this.getColumns();
    this.container.style.setProperty('--grid-columns', columns);
  }
}

export default GridWidget;
export { GridWidget };
