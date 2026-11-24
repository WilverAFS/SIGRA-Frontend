import api from './api';
import type { DashboardSummary } from '@/types/dashboard';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    const response = await api.get<ApiResponse<DashboardSummary>>(
      '/dashboard/summary'
    );

    return response.data.data;
  },
};
