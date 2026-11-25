// src/services/catalogs.service.ts
import type { PaginatedResponse } from '@/types/api';
import type { CatalogOption } from '@/types/materials';

import api from './api';

/**
 * Consultas de catálogos usadas como opciones de selección.
 * (El CRUD completo de catálogos corresponde a sus propias actividades.)
 */
export const catalogsService = {
  /** Materias activas (6.6.1) para seleccionar en formularios y filtros. */
  async subjectOptions(): Promise<CatalogOption[]> {
    const { data } = await api.get<PaginatedResponse<CatalogOption>>(
      '/subjects',
      { params: { limit: 100, isActive: true } },
    );
    return data.data.map(({ id, code, name }) => ({ id, code, name }));
  },

  /** Periodos académicos (6.5.1) para seleccionar en formularios y filtros. */
  async periodOptions(): Promise<CatalogOption[]> {
    const { data } = await api.get<PaginatedResponse<CatalogOption>>(
      '/academic-periods',
      { params: { limit: 100 } },
    );
    return data.data.map(({ id, code, name }) => ({ id, code, name }));
  },
};
