import api from './api';
import type {
  AuditFilters,
  AuditLog,
  AuditLogPage,
} from '@/types/audit';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  meta: AuditLogPage['meta'];
  links: AuditLogPage['links'];
}

export const auditService = {
  async list(filters: AuditFilters = {}): Promise<AuditLogPage> {
    const response = await api.get<PaginatedApiResponse<AuditLog>>(
      '/audit-logs',
      { params: filters }
    );

    return {
      data: response.data.data,
      meta: response.data.meta,
      links: response.data.links,
    };
  },

  async getById(id: number): Promise<AuditLog> {
    const response = await api.get<ApiResponse<AuditLog>>(
      `/audit-logs/${id}`
    );

    return response.data.data;
  },
};
