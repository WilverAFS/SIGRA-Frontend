// src/types/materials.ts

/** MaterialType (contrato 5.3). */
export const MaterialType = {
  PLANEACION: 'PLANEACION',
  TEMARIO: 'TEMARIO',
  APUNTE: 'APUNTE',
  DIAPOSITIVA: 'DIAPOSITIVA',
  PRACTICA: 'PRACTICA',
  EVALUACION: 'EVALUACION',
  OTRO: 'OTRO',
} as const;
export type MaterialType = (typeof MaterialType)[keyof typeof MaterialType];

export const materialTypeLabels: Record<MaterialType, string> = {
  PLANEACION: 'Planeación didáctica',
  TEMARIO: 'Temario',
  APUNTE: 'Apunte',
  DIAPOSITIVA: 'Diapositivas',
  PRACTICA: 'Práctica',
  EVALUACION: 'Evaluación',
  OTRO: 'Otro',
};

/** MaterialVisibility (contrato 5.3). */
export const MaterialVisibility = {
  ESTUDIANTES_Y_DOCENTES: 'ESTUDIANTES_Y_DOCENTES',
  SOLO_DOCENTES: 'SOLO_DOCENTES',
} as const;
export type MaterialVisibility =
  (typeof MaterialVisibility)[keyof typeof MaterialVisibility];

export const visibilityLabels: Record<MaterialVisibility, string> = {
  ESTUDIANTES_Y_DOCENTES: 'Estudiantes y docentes',
  SOLO_DOCENTES: 'Solo docentes',
};

/** MaterialVersionResource (contrato 5.4.10). */
export interface MaterialVersion {
  id: number;
  materialId: number;
  versionNumber: number;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  checksumSha256: string;
  changelog: string | null;
  uploadedBy: number;
  createdAt: string;
}

/** MaterialResource (contrato 5.4.9). */
export interface Material {
  id: number;
  subjectId: number;
  authorId: number;
  academicPeriodId: number;
  title: string;
  description: string | null;
  materialType: MaterialType;
  visibility: MaterialVisibility;
  currentVersion: number;
  syllabusChangesNote: string | null;
  downloadCount: number;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  author?: { id: number; firstName: string; lastName: string };
  subject?: { id: number; code: string; name: string };
  academicPeriod?: { id: number; code: string; name: string };
  /** Solo en el detalle y al crear (6.8.2 y 6.8.3). */
  currentVersionDetail?: MaterialVersion;
}

export type MaterialSortField = 'createdAt' | 'title' | 'downloadCount';

/** Filtros de GET /materials (6.8.1 sobre ListQueryRequest 5.5.15). */
export interface MaterialListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort?: `${MaterialSortField}:${'asc' | 'desc'}`;
  instituteId?: number;
  subjectId?: number;
  academicPeriodId?: number;
  authorId?: number;
  materialType?: MaterialType;
  /** Solo tiene efecto para ADMIN y DOCENTE. */
  visibility?: MaterialVisibility;
}

/** Campos de texto de CreateMaterialRequest (5.5.12); el archivo va aparte. */
export interface CreateMaterialFields {
  subjectId: number;
  academicPeriodId: number;
  title: string;
  description?: string;
  materialType: MaterialType;
  visibility?: MaterialVisibility;
  syllabusChangesNote?: string;
  changelog?: string;
}

/** UpdateMaterialRequest (5.5.13): todo opcional, nunca el archivo. */
export interface UpdateMaterialRequest {
  title?: string;
  description?: string | null;
  materialType?: MaterialType;
  visibility?: MaterialVisibility;
  syllabusChangesNote?: string | null;
  /** Solo lo toma en cuenta el backend si lo envía un ADMIN. */
  isApproved?: boolean;
}

/** Opción simple para los selectores de materia y periodo. */
export interface CatalogOption {
  id: number;
  code: string;
  name: string;
}
