// src/utils/error-handler.ts

import type { ApiErrorResponse, ErrorDetail } from '@/types/api';

type AxiosLikeError = {
  response?: {
    status?: number;
    data?: ApiErrorResponse;
  };
};

function errorData(error: unknown): ApiErrorResponse | undefined {
  return (error as AxiosLikeError)?.response?.data;
}

/**
 * Mensaje de error del backend para un campo (errores 422 junto al campo).
 *
 * El contrato (4.1) envía `error.details` como lista `[{ field, message }]`;
 * también se acepta el formato anterior `{ campo: [mensajes] }`.
 */
export function getFieldError(error: unknown, field: string): string | null {
  const details = errorData(error)?.error?.details;
  if (!details) {
    return null;
  }
  if (Array.isArray(details)) {
    return (
      details.find((detail: ErrorDetail) => detail.field === field)?.message ??
      null
    );
  }
  return details[field]?.[0] ?? null;
}

/** Código de negocio del error (catálogo 4.3), p. ej. `FILE_TOO_LARGE`. */
export function getErrorCode(error: unknown): string | null {
  return errorData(error)?.error?.code ?? null;
}

/** Estado HTTP del error, si lo hay. */
export function getErrorStatus(error: unknown): number | null {
  return (error as AxiosLikeError)?.response?.status ?? null;
}

/**
 * Mensaje legible para mostrar al usuario. Usa el `message` del backend y,
 * si no hay respuesta (sin conexión), un texto genérico.
 */
export function getErrorMessage(
  error: unknown,
  fallback = 'Ocurrió un error inesperado. Intenta de nuevo.',
): string {
  const data = errorData(error);
  if (data?.message) {
    return data.message;
  }
  if (!(error as AxiosLikeError)?.response) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión.';
  }
  return fallback;
}
