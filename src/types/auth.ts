import type { UserRole } from './roles';

export interface UserProfile {
  id: number;
  institutionalId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  instituteId: number;
  careerId: number | null;
  isActive: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  institutionalId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Extract<UserRole, 'DOCENTE' | 'ESTUDIANTE'>;
  instituteId: number;
  careerId: number;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirmation: string;
}

export interface AuthData {
  user: UserProfile;
  accessToken: string;
  refreshToken?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: AuthData;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: UserProfile;
    accessToken?: string;
    refreshToken?: string;
  };
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  data: UserProfile;
}
