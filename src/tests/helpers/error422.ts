// Respuesta 422 con el formato real del contrato (4.1): details es un ARRAY
import {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

export function crearError422(): AxiosError {
  const respuesta: AxiosResponse = {
    status: 422,
    statusText: 'Unprocessable Entity',
    headers: {},
    config: {} as InternalAxiosRequestConfig,
    data: {
      success: false,
      message: 'Los datos enviados no son válidos.',
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        details: [
          { field: 'code', message: 'El código ya existe.' },
          { field: 'name', message: 'El nombre es obligatorio.' },
        ],
      },
    },
  };

  return new AxiosError(
    'Request failed with status code 422',
    'ERR_BAD_REQUEST',
    undefined,
    undefined,
    respuesta
  );
}