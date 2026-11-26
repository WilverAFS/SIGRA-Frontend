// Contrato v1.2: 5.4.1 (UserResource), 5.5.5 (CreateUserRequest), 5.5.6 (UpdateUserRequest)
import type { UserRole } from './roles';

export type Usuario = {
  id: number;
  roleId: number;
  role: UserRole;
  instituteId: number;
  careerId: number | null;
  institutionalId: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UsuarioNuevo = {
  institutionalId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  instituteId: number;
  careerId: number | null;
};

export type UsuarioCambios = {
  firstName: string;
  lastName: string;
  role: UserRole;
  careerId: number | null;
  isActive: boolean;
};

export type FiltrosUsuarios = {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  instituteId?: number;
  isActive?: boolean;
};