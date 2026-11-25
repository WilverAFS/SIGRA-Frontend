// Utilidades compartidas por las pruebas del módulo de materiales
import { createPinia, setActivePinia } from 'pinia';
import { createMemoryHistory, createRouter } from 'vue-router';

import { useAuthStore } from '@/stores/auth';
import type { UserProfile } from '@/types/auth';
import type { Material, MaterialVersion } from '@/types/materials';
import type { UserRole } from '@/types/roles';

export function makeUser(role: UserRole, id = 7): UserProfile {
  return {
    id,
    institutionalId: `ID${id}`,
    firstName: 'Usuario',
    lastName: 'De Prueba',
    email: `u${id}@itoaxaca.edu.mx`,
    role,
    instituteId: 1,
    careerId: role === 'ADMIN' ? null : 1,
    isActive: true,
  };
}

/** Pinia activa con una sesión del rol indicado (o sin sesión). */
export function loginAs(role: UserRole | null, id = 7) {
  localStorage.clear();
  const pinia = createPinia();
  setActivePinia(pinia);
  const store = useAuthStore();
  if (role) {
    store.setSession('token-de-prueba', makeUser(role, id));
  }
  return { pinia, store };
}

export function makeVersion(overrides: Partial<MaterialVersion> = {}): MaterialVersion {
  return {
    id: 21,
    materialId: 8,
    versionNumber: 1,
    originalFileName: 'planeacion.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 490204,
    checksumSha256: 'a'.repeat(64),
    changelog: 'Versión inicial.',
    uploadedBy: 7,
    createdAt: '2026-11-20T10:00:00.000Z',
    ...overrides,
  };
}

export function makeMaterial(overrides: Partial<Material> = {}): Material {
  return {
    id: 8,
    subjectId: 3,
    authorId: 7,
    academicPeriodId: 2,
    title: 'Planeación didáctica 2026-2',
    description: 'Planeación por unidades.',
    materialType: 'PLANEACION',
    visibility: 'ESTUDIANTES_Y_DOCENTES',
    currentVersion: 1,
    syllabusChangesNote: null,
    downloadCount: 4,
    isApproved: true,
    createdAt: '2026-11-20T10:00:00.000Z',
    updatedAt: '2026-11-20T10:00:00.000Z',
    author: { id: 7, firstName: 'Wilver Alfredo', lastName: 'Flores Santiago' },
    subject: { id: 3, code: 'DSD-2303', name: 'Desarrollo de Servicios Web' },
    academicPeriod: { id: 2, code: '2026-2', name: 'Agosto - Diciembre 2026' },
    currentVersionDetail: makeVersion(),
    ...overrides,
  };
}

/** Router en memoria con rutas mínimas para montar las vistas. */
export function makeRouter(component: object, path: string) {
  const stub = { template: '<div />' };
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/materiales', component: path === '/materiales' ? component : stub },
      { path: '/materiales/nuevo', component: path === '/materiales/nuevo' ? component : stub },
      { path: '/materiales/:id', component: path === '/materiales/:id' ? component : stub },
      { path: '/materiales/:id/editar', component: path === '/materiales/:id/editar' ? component : stub },
      { path: '/403', component: stub },
    ],
  });
}

/** Error con la forma de Axios y la estructura del contrato (cap. 4). */
export function apiError(
  status: number,
  code: string,
  message: string,
  details?: { field: string; message: string }[],
) {
  return {
    response: {
      status,
      data: { success: false, message, data: null, error: { code, details } },
    },
  };
}

export const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
