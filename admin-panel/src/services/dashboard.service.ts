/**
 * Dashboard Service
 */

import api from './api';
import type { DashboardStats } from '@/types';

export const dashboardService = {
  /**
   * Get dashboard statistics
   */
  async getStats(): Promise<DashboardStats> {
    return api.get<DashboardStats>('/api/admin/dashboard/stats');
  },
};

export default dashboardService;
