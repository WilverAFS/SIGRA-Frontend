// src/types/api.ts

export interface ValidationErrors {
  [field: string]: string[];
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error?: {
    details?: ValidationErrors;
  };
}

