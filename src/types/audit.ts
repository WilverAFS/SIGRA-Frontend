export interface AuditLog {
  id: number;
  userId: number | null;
  action: string;
  entityName: string;
  entityId: number | null;
  metadata: unknown;
  createdAt: string;
}

export interface AuditFilters {
  page?: number;
  limit?: number;
  userId?: number;
  action?: string;
  entityName?: string;
  entityId?: number;
  from?: string;
  to?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationLinks {
  self: string;
  next: string | null;
  prev: string | null;
}

export interface AuditLogPage {
  data: AuditLog[];
  meta: PaginationMeta;
  links: PaginationLinks;
}
