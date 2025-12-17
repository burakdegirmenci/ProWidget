/**
 * Authentication Service
 */

import api from './api';
import type { User, LoginCredentials, AuthResponse } from '@/types';

export const authService = {
  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/admin/auth/login', credentials);
    api.setTokens(response.accessToken, response.refreshToken);
    return response;
  },

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await api.post('/api/admin/auth/logout');
    } finally {
      api.clearTokens();
    }
  },

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User> {
    return api.get<User>('/api/admin/auth/me');
  },

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/api/admin/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!api.getToken();
  },
};

export default authService;
