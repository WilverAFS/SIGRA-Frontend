
import { isAxiosError } from 'axios';

type DetalleCampo = {
  field: string;
  message: string;
};

export function obtenerCodigoError(err: unknown): string | null {
  if (!isAxiosError(err)) return null;
  return err.response?.data?.error?.code ?? null;
}

export function obtenerErroresPorCampo(err: unknown): Record<string, string> {
  if (!isAxiosError(err)) return {};

  const detalles = err.response?.data?.error?.details;
  if (!Array.isArray(detalles)) return {};

  const errores: Record<string, string> = {};

  for (const detalle of detalles as DetalleCampo[]) {
    if (detalle?.field && !(detalle.field in errores)) {
      errores[detalle.field] = detalle.message;
    }
  }

  return errores;
}