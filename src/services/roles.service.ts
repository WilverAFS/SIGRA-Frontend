// Contrato v1.2, secciones 6.2.6 y 6.2.7 (solo lectura)
import api from './api';
import type { Rol } from '@/types/rol';
import type { RespuestaElemento, RespuestaLista } from '@/types/institutos';

export const rolesService = {
  // No es una colección paginada: la respuesta no trae meta ni links
  listar() {
    return api.get<RespuestaLista<Rol>>('/roles');
  },

  obtener(id: number) {
    return api.get<RespuestaElemento<Rol>>(`/roles/${id}`);
  },
};