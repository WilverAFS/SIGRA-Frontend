// src/utils/permisos-materiales.ts
import type { UserProfile } from '@/types/auth';
import type { Material } from '@/types/materials';
import { UserRole } from '@/types/roles';

/**
 * Reglas por rol de materiales (matriz 2.3). El backend las vuelve a
 * aplicar; aquí solo deciden qué botones y secciones se muestran.
 */

/** DOCENTE y ADMIN pueden subir materiales (6.8.2). */
export function puedeCrearMaterial(user: UserProfile | null): boolean {
  return user?.role === UserRole.ADMIN || user?.role === UserRole.DOCENTE;
}

/**
 * Editar, eliminar y subir versiones: el autor (DOCENTE) o ADMIN
 * (6.8.4, 6.8.5 y 6.8.8).
 */
export function puedeGestionarMaterial(
  user: UserProfile | null,
  material: Pick<Material, 'authorId'>,
): boolean {
  if (!user) {
    return false;
  }
  if (user.role === UserRole.ADMIN) {
    return true;
  }
  return user.role === UserRole.DOCENTE && material.authorId === user.id;
}

/** El historial de versiones es solo para DOCENTE y ADMIN (6.8.7). */
export function puedeVerHistorial(user: UserProfile | null): boolean {
  return puedeCrearMaterial(user);
}

/** Solo ADMIN aprueba materiales y filtra por visibilidad (5.5.13, 6.8.1). */
export function esAdmin(user: UserProfile | null): boolean {
  return user?.role === UserRole.ADMIN;
}

/** El filtro de visibilidad solo aplica a ADMIN y DOCENTE (6.8.1). */
export function puedeFiltrarVisibilidad(user: UserProfile | null): boolean {
  return puedeCrearMaterial(user);
}
