// PROVISIONAL: confirmar nombres de campos con el ContratoAPI-SIGRA (sección 6.3)

export type Instituto = {
  id: number;
  code: string;
  name: string;
  shortName: string;
  city: string;
  state: string;
  isActive: boolean;
};

export type InstitutoPayload = {
  code: string;
  name: string;
  shortName: string;
  city: string;
  state: string;
  isActive: boolean;
};

export type MetaPaginacion = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type RespuestaLista<T> = {
  success: boolean;
  message: string;
  data: T[];
  meta?: MetaPaginacion;
};

export type RespuestaElemento<T> = {
  success: boolean;
  message: string;
  data: T;
};