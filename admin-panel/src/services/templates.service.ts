/**
 * Templates Service
 * API service for custom template management
 */

import api from './api';
import type {
  CustomTemplate,
  TemplateCreateInput,
  TemplateUpdateInput,
  TemplateValidationResult,
} from '@/types';

export const templatesService = {
  // ========================================
  // Template CRUD
  // ========================================

  /**
   * Get all templates for a customer
   */
  async getByCustomer(customerId: string): Promise<CustomTemplate[]> {
    return api.get<CustomTemplate[]>(`/api/admin/customers/${customerId}/templates`);
  },

  /**
   * Get template by ID
   */
  async getById(templateId: string): Promise<CustomTemplate> {
    return api.get<CustomTemplate>(`/api/admin/templates/${templateId}`);
  },

  /**
   * Create new template
   */
  async create(customerId: string, data: TemplateCreateInput): Promise<CustomTemplate> {
    return api.post<CustomTemplate>(`/api/admin/customers/${customerId}/templates`, data);
  },

  /**
   * Update template
   */
  async update(templateId: string, data: TemplateUpdateInput): Promise<CustomTemplate> {
    return api.patch<CustomTemplate>(`/api/admin/templates/${templateId}`, data);
  },

  /**
   * Delete template
   */
  async delete(templateId: string): Promise<void> {
    await api.delete(`/api/admin/templates/${templateId}`);
  },

  /**
   * Duplicate template
   */
  async duplicate(templateId: string): Promise<CustomTemplate> {
    return api.post<CustomTemplate>(`/api/admin/templates/${templateId}/duplicate`);
  },

  /**
   * Validate template HTML and CSS
   */
  async validate(data: { htmlTemplate: string; cssStyles?: string }): Promise<TemplateValidationResult> {
    return api.post<TemplateValidationResult>('/api/admin/templates/validate', data);
  },

  /**
   * Get template with rendered preview (using sample data)
   */
  async getPreview(templateId: string, customData?: Record<string, any>): Promise<{
    html: string;
    css: string;
  }> {
    return api.post<{ html: string; css: string }>(`/api/admin/templates/${templateId}/preview`, {
      customData,
    });
  },

  // ========================================
  // Template Helpers
  // ========================================

  /**
   * Get sample template HTML
   */
  getSampleHtml(): string {
    return `<div class="promo-banner">
  <h1>{{headline}}</h1>
  <p>{{subtext}}</p>

  {{#if showCountdown}}
    <div class="countdown">{{countdown countdownTarget}}</div>
  {{/if}}

  <div class="products">
    {{#each products}}
      <div class="product-card">
        <img src="{{imageLink}}" alt="{{title}}">
        <h3>{{truncate title 50}}</h3>
        <div class="price">
          {{#if salePrice}}
            <span class="sale">{{formatPrice salePrice}}</span>
            <span class="original">{{formatPrice price}}</span>
          {{else}}
            <span>{{formatPrice price}}</span>
          {{/if}}
        </div>
        <button
          data-pwx-action="navigate"
          data-pwx-payload='{"url": "{{link}}"}'>
          Detay
        </button>
      </div>
    {{/each}}
  </div>
</div>`;
  },

  /**
   * Get sample template CSS
   */
  getSampleCss(): string {
    return `.promo-banner {
  background: var(--pwx-primary-color, #007bff);
  padding: 40px;
  border-radius: 12px;
  text-align: center;
  color: white;
}

.promo-banner h1 {
  font-size: 32px;
  margin-bottom: 10px;
}

.promo-banner p {
  font-size: 18px;
  opacity: 0.9;
  margin-bottom: 20px;
}

.countdown {
  font-size: 24px;
  font-weight: bold;
  background: rgba(255,255,255,0.2);
  padding: 10px 20px;
  border-radius: 8px;
  display: inline-block;
  margin-bottom: 30px;
}

.products {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 30px;
}

.product-card {
  background: white;
  color: #333;
  padding: 20px;
  border-radius: 8px;
  text-align: left;
}

.product-card img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 10px;
}

.product-card h3 {
  font-size: 14px;
  margin-bottom: 8px;
  line-height: 1.4;
}

.product-card .price {
  margin-bottom: 10px;
}

.product-card .sale {
  color: #e74c3c;
  font-weight: bold;
  font-size: 18px;
}

.product-card .original {
  color: #999;
  text-decoration: line-through;
  font-size: 14px;
  margin-left: 8px;
}

.product-card button {
  width: 100%;
  padding: 10px;
  background: var(--pwx-primary-color, #007bff);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.product-card button:hover {
  opacity: 0.9;
}`;
  },

  /**
   * Get sample data schema
   */
  getSampleDataSchema(): Record<string, any> {
    return {
      headline: {
        type: 'string',
        label: 'Headline',
        default: 'Summer Sale!',
      },
      subtext: {
        type: 'string',
        label: 'Subtext',
        default: 'Get up to 50% off on selected items',
      },
      showCountdown: {
        type: 'boolean',
        label: 'Show Countdown',
        default: true,
      },
      countdownTarget: {
        type: 'date',
        label: 'Countdown Target',
        default: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    };
  },

  /**
   * Get sample default data
   */
  getSampleDefaultData(): Record<string, any> {
    return {
      headline: 'Summer Sale!',
      subtext: 'Get up to 50% off on selected items',
      showCountdown: true,
      countdownTarget: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  },
};

export default templatesService;
