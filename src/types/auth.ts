export type RoleName = 'ADMIN' | 'DOCENTE' | 'ESTUDIANTE';

export interface UserProfile {
  id: number;
  institutionalId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: RoleName;
  instituteId: number;
  careerId: number | null;
  isActive: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: UserProfile;
    accessToken: string;
    refreshToken?: string;
  };
}