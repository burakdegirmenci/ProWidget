/**
 * Customers Service
 */

import api from './api';
import type {
  Customer,
  CustomerCreateInput,
  CustomerUpdateInput,
  WidgetConfig,
  WidgetCreateInput,
  WidgetUpdateInput,
  Theme,
  ThemeInput,
  XmlFeed,
  XmlFeedInput,
  Product,
  PaginatedResponse,
} from '@/types';

export const customersService = {
  // ========================================
  // Customer CRUD
  // ========================================

  /**
   * Get all customers
   */
  async getAll(params?: { page?: number; limit?: number; search?: string }): Promise<{
    customers: Customer[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const response = await api.get<any>('/api/admin/customers', params);
    return {
      customers: response.customers || response,
      pagination: response.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  },

  /**
   * Get customer by ID
   */
  async getById(id: string): Promise<Customer> {
    return api.get<Customer>(`/api/admin/customers/${id}`);
  },

  /**
   * Create new customer
   */
  async create(data: CustomerCreateInput): Promise<Customer> {
    return api.post<Customer>('/api/admin/customers', data);
  },

  /**
   * Update customer
   */
  async update(id: string, data: CustomerUpdateInput): Promise<Customer> {
    return api.patch<Customer>(`/api/admin/customers/${id}`, data);
  },

  /**
   * Delete customer
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/api/admin/customers/${id}`);
  },

  /**
   * Regenerate API key
   */
  async regenerateApiKey(id: string): Promise<{ apiKey: string }> {
    return api.post<{ apiKey: string }>(`/api/admin/customers/${id}/regenerate-key`);
  },

  // ========================================
  // Widget Operations
  // ========================================

  /**
   * Get customer widgets
   */
  async getWidgets(customerId: string): Promise<WidgetConfig[]> {
    return api.get<WidgetConfig[]>(`/api/admin/customers/${customerId}/widgets`);
  },

  /**
   * Create widget for customer
   */
  async createWidget(customerId: string, data: WidgetCreateInput): Promise<WidgetConfig> {
    return api.post<WidgetConfig>(`/api/admin/customers/${customerId}/widgets`, data);
  },

  /**
   * Update widget
   */
  async updateWidget(
    customerId: string,
    widgetId: string,
    data: WidgetUpdateInput
  ): Promise<WidgetConfig> {
    return api.patch<WidgetConfig>(`/api/admin/widgets/${widgetId}`, data);
  },

  /**
   * Delete widget
   */
  async deleteWidget(customerId: string, widgetId: string): Promise<void> {
    await api.delete(`/api/admin/widgets/${widgetId}`);
  },

  // ========================================
  // Theme Operations
  // ========================================

  /**
   * Get customer theme
   */
  async getTheme(customerId: string): Promise<Theme | null> {
    try {
      return await api.get<Theme>(`/api/admin/customers/${customerId}/theme`);
    } catch {
      return null;
    }
  },

  /**
   * Update customer theme
   */
  async updateTheme(customerId: string, data: ThemeInput): Promise<Theme> {
    return api.post<Theme>(`/api/admin/customers/${customerId}/theme`, data);
  },

  // ========================================
  // Feed Operations
  // ========================================

  /**
   * Get customer feeds
   */
  async getFeeds(customerId: string): Promise<XmlFeed[]> {
    try {
      return await api.get<XmlFeed[]>(`/api/admin/customers/${customerId}/feeds`);
    } catch {
      return [];
    }
  },

  /**
   * Get single feed by ID
   */
  async getFeed(feedId: string): Promise<XmlFeed | null> {
    try {
      return await api.get<XmlFeed>(`/api/admin/feeds/${feedId}`);
    } catch {
      return null;
    }
  },

  /**
   * Create customer feed
   */
  async createFeed(customerId: string, data: XmlFeedInput): Promise<XmlFeed> {
    return api.post<XmlFeed>(`/api/admin/customers/${customerId}/feeds`, data);
  },

  /**
   * Update feed
   */
  async updateFeed(feedId: string, data: Partial<XmlFeedInput>): Promise<XmlFeed> {
    return api.patch<XmlFeed>(`/api/admin/feeds/${feedId}`, data);
  },

  /**
   * Delete feed
   */
  async deleteFeed(feedId: string): Promise<void> {
    await api.delete(`/api/admin/feeds/${feedId}`);
  },

  /**
   * Trigger manual feed sync
   */
  async syncFeed(feedId: string): Promise<{ message: string }> {
    return api.post<{ message: string }>(`/api/admin/feeds/${feedId}/sync`);
  },

  // ========================================
  // Product Operations
  // ========================================

  /**
   * Get customer products
   */
  async getProducts(
    customerId: string,
    params?: { page?: number; limit?: number; search?: string }
  ): Promise<{ products: Product[]; pagination: any }> {
    return api.get<{ products: Product[]; pagination: any }>(
      `/api/admin/customers/${customerId}/products`,
      params
    );
  },
};

export default customersService;
