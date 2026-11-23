import api from './api';

export type DependencyStatus = 'up' | 'down';
export type HealthStatus = 'ok' | 'degraded';

export interface HealthData {
  status: HealthStatus;
  version: string;
  timestamp: string;
  services: {
    database: DependencyStatus;
    cache: DependencyStatus;
    queue: DependencyStatus;
  };
}

interface HealthApiResponse {
  success: boolean;
  message: string;
  data: HealthData;
}

export const healthService = {
  async getHealth(): Promise<HealthData> {
    const response = await api.get<HealthApiResponse>(
      '/health',
      {
        validateStatus: (status) =>
          status === 200 || status === 503,
      }
    );

    return response.data.data;
  },
};
