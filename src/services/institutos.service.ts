// src/services/institutos.service.ts
// PROVISIONAL: confirmar rutas y métodos con el ContratoAPI-SIGRA (sección 6.3)
import api from './api';
import type {
  Instituto,
  InstitutoPayload,
  RespuestaElemento,
  RespuestaLista,
} from '@/types/institutos';

export const institutosService = {
  listar(params?: { page?: number; limit?: number }) {
    return api.get<RespuestaLista<Instituto>>('/institutes', { params });
  },

  obtener(id: number) {
    return api.get<RespuestaElemento<Instituto>>(`/institutes/${id}`);
  },

  crear(payload: InstitutoPayload) {
    return api.post<RespuestaElemento<Instituto>>('/institutes', payload);
  },

    actualizar(id: number, payload: Partial<InstitutoPayload>) {
    return api.patch<RespuestaElemento<Instituto>>(`/institutes/${id}`, payload);
  },

  eliminar(id: number) {
    return api.delete(`/institutes/${id}`);
  },
};