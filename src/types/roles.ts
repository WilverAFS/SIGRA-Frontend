// src/types/roles.ts

export const UserRole = {
  ADMIN: 'ADMIN',
  DOCENTE: 'DOCENTE',
  ESTUDIANTE: 'ESTUDIANTE',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];