// Contrato v1.2, sección 6.2 (usuarios)
import api from './api';
import type {
  FiltrosUsuarios,
  Usuario,
  UsuarioCambios,
  UsuarioNuevo,
} from '@/types/usuarios';
import type { RespuestaElemento, RespuestaLista } from '@/types/institutos';

export const usuariosService = {
  listar(params?: FiltrosUsuarios) {
    return api.get<RespuestaLista<Usuario>>('/users', { params });
  },

  obtener(id: number) {
    return api.get<RespuestaElemento<Usuario>>(`/users/${id}`);
  },

  crear(payload: UsuarioNuevo) {
    return api.post<RespuestaElemento<Usuario>>('/users', payload);
  },

  actualizar(id: number, payload: Partial<UsuarioCambios>) {
    return api.patch<RespuestaElemento<Usuario>>(`/users/${id}`, payload);
  },

  eliminar(id: number) {
    return api.delete(`/users/${id}`);
  },
};