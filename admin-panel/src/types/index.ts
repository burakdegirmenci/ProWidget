/**
 * Type Definitions
 * Shared types for admin panel
 */

// ========================================
// User & Auth Types
// ========================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'VIEWER';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ========================================
// Customer Types
// ========================================

export interface Customer {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  apiKey: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    widgets: number;
    products: number;
  };
}

export interface CustomerCreateInput {
  name: string;
  slug: string;
  domain?: string;
}

export interface CustomerUpdateInput {
  name?: string;
  domain?: string;
  isActive?: boolean;
}

// ========================================
// Widget Types
// ========================================

export type WidgetType = 'CAROUSEL' | 'BANNER' | 'POPUP' | 'GRID' | 'SLIDER' | 'CUSTOM';

export interface WidgetConfig {
  id: string;
  customerId: string;
  type: WidgetType;
  name: string;
  placement?: string; // CSS selector veya fixed position (bottom-right, top-left, vb.)
  config: Record<string, any>;
  isActive: boolean;
  templateId?: string | null;
  customData?: Record<string, any> | null;
  template?: CustomTemplate | null;
  createdAt: string;
  updatedAt: string;
}

export interface WidgetCreateInput {
  type: WidgetType;
  name: string;
  placement?: string; // CSS selector veya fixed position
  config?: Record<string, any>;
  templateId?: string;
  customData?: Record<string, any>;
}

export interface WidgetUpdateInput {
  name?: string;
  placement?: string; // CSS selector veya fixed position
  config?: Record<string, any>;
  isActive?: boolean;
  templateId?: string;
  customData?: Record<string, any>;
}

// ========================================
// Custom Template Types
// ========================================

export interface CustomTemplate {
  id: string;
  customerId: string;
  name: string;
  description?: string | null;
  htmlTemplate: string;
  cssStyles?: string | null;
  dataSchema: Record<string, any>;
  defaultData: Record<string, any>;
  isGlobal: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateCreateInput {
  name: string;
  description?: string;
  htmlTemplate: string;
  cssStyles?: string;
  dataSchema?: Record<string, any>;
  defaultData?: Record<string, any>;
  isGlobal?: boolean;
}

export interface TemplateUpdateInput {
  name?: string;
  description?: string;
  htmlTemplate?: string;
  cssStyles?: string;
  dataSchema?: Record<string, any>;
  defaultData?: Record<string, any>;
  isGlobal?: boolean;
  isActive?: boolean;
}

export interface TemplateValidationResult {
  valid: boolean;
  html?: {
    valid: boolean;
    sanitized?: string;
    errors?: string[];
  };
  css?: {
    valid: boolean;
    sanitized?: string;
    errors?: string[];
  };
}

// ========================================
// Theme Types
// ========================================

export interface Theme {
  id: string;
  customerId: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  borderRadius: string;
  customCss: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ThemeInput {
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  borderRadius?: string;
  customCss?: string;
}

// ========================================
// XML Feed Types
// ========================================

export type FeedFormat = 'google' | 'facebook' | 'custom';
export type FeedStatus = 'active' | 'pending' | 'syncing' | 'error';

export interface XmlFeed {
  id: string;
  customerId: string;
  name: string;
  url: string;
  format: FeedFormat;
  status: FeedStatus;
  lastSync: string | null;
  lastError: string | null;
  productCount: number;
  syncInterval: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface XmlFeedInput {
  name: string;
  url: string;
  format?: FeedFormat;
  syncInterval?: number;
}

// ========================================
// Product Types
// ========================================

export interface Product {
  id: string;
  customerId: string;
  externalId: string;
  title: string;
  description: string | null;
  link: string;
  imageLink: string | null;
  price: number;
  salePrice: number | null;
  currency: string;
  brand: string | null;
  category: string | null;
  availability: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ========================================
// API Response Types
// ========================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

// ========================================
// Dashboard Types
// ========================================

export interface DashboardStats {
  totalCustomers: number;
  activeCustomers: number;
  totalWidgets: number;
  activeWidgets: number;
  totalProducts: number;
  recentCustomers: Customer[];
}

// ========================================
// Common Types
// ========================================

export interface SelectOption {
  value: string;
  label: string;
}

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}
