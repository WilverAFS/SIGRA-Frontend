// src/utils/error-handler.ts

import type { ApiErrorResponse } from '@/types/api';

export function getFieldError(
  error: unknown,
  field: string,
): string | null {
  const response =
    error as {
      response?: {
        data?: ApiErrorResponse;
      };
    };

  const details =
    response.response?.data?.error?.details;

  if (!details) {
    return null;
  }

  return details[field]?.[0] ?? null;
}