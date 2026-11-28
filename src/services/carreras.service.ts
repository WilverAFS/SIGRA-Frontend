// Contrato v1.2, sección 6.4
import api from './api';
import type { Carrera, CarreraPayload, FiltrosCarreras } from '@/types/carreras';
import type { RespuestaElemento, RespuestaLista } from '@/types/institutos';

export const carrerasService = {
  listar(params?: FiltrosCarreras) {
    return api.get<RespuestaLista<Carrera>>('/careers', { params });
  },

  obtener(id: number) {
    return api.get<RespuestaElemento<Carrera>>(`/careers/${id}`);
  },

  crear(payload: CarreraPayload) {
    return api.post<RespuestaElemento<Carrera>>('/careers', payload);
  },

  actualizar(id: number, payload: Partial<CarreraPayload>) {
    return api.patch<RespuestaElemento<Carrera>>(`/careers/${id}`, payload);
  },

  eliminar(id: number) {
    return api.delete(`/careers/${id}`);
  },
};