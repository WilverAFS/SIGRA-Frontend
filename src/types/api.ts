// src/types/api.ts

/**
 * Detalle por campo de un error (ContratoAPI-SIGRA 4.1):
 * `error.details` es una lista de `{ field, message }`.
 */
export interface ErrorDetail {
  field: string;
  message: string;
}

/**
 * Formato anterior (objeto campo → mensajes). Se conserva solo para no
 * romper código que aún lo use.
 */
export interface ValidationErrors {
  [field: string]: string[];
}

/** Estructura estándar de error (contrato cap. 4). */
export interface ApiErrorResponse {
  success: false;
  message: string;
  data?: null;
  error?: {
    code?: string;
    details?: ErrorDetail[] | ValidationErrors;
  };
}

/** Envoltura global de respuesta exitosa (contrato 5.4). */
export interface ApiResponse<T> {
  success: true;
  message: string;
  data: T;
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

/** Colección paginada (contrato 3.3 y 5.4). */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
  links: PaginationLinks;
}
