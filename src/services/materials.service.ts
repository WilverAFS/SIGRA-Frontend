// src/services/materials.service.ts
import type { AxiosError, AxiosResponse } from 'axios';

import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type {
  CreateMaterialFields,
  Material,
  MaterialListQuery,
  MaterialVersion,
  UpdateMaterialRequest,
} from '@/types/materials';
import { fileNameFromDisposition } from '@/utils/archivos';

import api from './api';

/** Archivo descargado, listo para `saveBlob`. */
export interface DownloadedFile {
  blob: Blob;
  fileName: string;
}

const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } };

/**
 * Las descargas piden `blob`; si el backend responde un error, el JSON
 * llega como Blob. Se convierte de vuelta a objeto para que
 * `getErrorMessage` / `getErrorCode` funcionen igual que en el resto.
 */
async function parseBlobError(error: unknown): Promise<never> {
  const axiosError = error as AxiosError;
  const data = axiosError.response?.data;
  if (data instanceof Blob) {
    try {
      axiosError.response!.data = JSON.parse(await data.text());
    } catch {
      // no era JSON: se deja como venía
    }
  }
  throw error;
}

async function download(url: string, fallbackName: string): Promise<DownloadedFile> {
  try {
    const response: AxiosResponse<Blob> = await api.get(url, {
      responseType: 'blob',
    });
    return {
      blob: response.data,
      fileName: fileNameFromDisposition(
        response.headers['content-disposition'] as string | undefined,
        fallbackName,
      ),
    };
  } catch (error) {
    return parseBlobError(error);
  }
}

/** Quitar filtros vacíos para no enviar `?subjectId=` sin valor. */
function cleanParams(query: MaterialListQuery): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(query).filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    ),
  );
}

/** Armar el multipart de CreateMaterialRequest (5.5.12). */
export function buildMaterialFormData(
  fields: CreateMaterialFields,
  file: File,
): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null && value !== '') {
      form.append(key, String(value));
    }
  }
  form.append('file', file);
  return form;
}

/**
 * Servicio del módulo de materiales y versiones (contrato 6.8.1–6.8.10).
 * Todas las llamadas pasan por `api` (VITE_API_URL + token).
 */
export const materialsService = {
  /** 6.8.1 Listar y buscar materiales. */
  async list(query: MaterialListQuery = {}): Promise<PaginatedResponse<Material>> {
    const { data } = await api.get<PaginatedResponse<Material>>('/materials', {
      params: cleanParams(query),
    });
    return data;
  },

  /** 6.8.2 Crear material con su primera versión (multipart). */
  async create(fields: CreateMaterialFields, file: File): Promise<Material> {
    const { data } = await api.post<ApiResponse<Material>>(
      '/materials',
      buildMaterialFormData(fields, file),
      MULTIPART,
    );
    return data.data;
  },

  /** 6.8.3 Obtener material (incluye currentVersionDetail). */
  async get(id: number): Promise<Material> {
    const { data } = await api.get<ApiResponse<Material>>(`/materials/${id}`);
    return data.data;
  },

  /** 6.8.4 Editar los datos del material (PATCH, sin archivo). */
  async update(id: number, changes: UpdateMaterialRequest): Promise<Material> {
    const { data } = await api.patch<ApiResponse<Material>>(
      `/materials/${id}`,
      changes,
    );
    return data.data;
  },

  /** 6.8.5 Eliminar material (baja lógica). Devuelve el mensaje. */
  async remove(id: number): Promise<string> {
    const { data } = await api.delete<ApiResponse<null>>(`/materials/${id}`);
    return data.message;
  },

  /** 6.8.6 Descargar la versión vigente. */
  downloadCurrent(id: number): Promise<DownloadedFile> {
    return download(`/materials/${id}/download`, `material-${id}`);
  },

  /** 6.8.7 Historial de versiones (DOCENTE y ADMIN). */
  async listVersions(
    id: number,
    query: { page?: number; limit?: number } = {},
  ): Promise<PaginatedResponse<MaterialVersion>> {
    const { data } = await api.get<PaginatedResponse<MaterialVersion>>(
      `/materials/${id}/versions`,
      { params: query },
    );
    return data;
  },

  /** 6.8.8 Subir una versión nueva (multipart). */
  async createVersion(
    id: number,
    file: File,
    changelog?: string,
  ): Promise<MaterialVersion> {
    const form = new FormData();
    if (changelog?.trim()) {
      form.append('changelog', changelog.trim());
    }
    form.append('file', file);
    const { data } = await api.post<ApiResponse<MaterialVersion>>(
      `/materials/${id}/versions`,
      form,
      MULTIPART,
    );
    return data.data;
  },

  /** 6.8.9 Obtener una versión concreta. */
  async getVersion(id: number, versionNumber: number): Promise<MaterialVersion> {
    const { data } = await api.get<ApiResponse<MaterialVersion>>(
      `/materials/${id}/versions/${versionNumber}`,
    );
    return data.data;
  },

  /** 6.8.10 Descargar una versión concreta. */
  downloadVersion(id: number, versionNumber: number): Promise<DownloadedFile> {
    return download(
      `/materials/${id}/versions/${versionNumber}/download`,
      `material-${id}-v${versionNumber}`,
    );
  },
};
