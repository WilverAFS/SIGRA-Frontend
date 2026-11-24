import api from './api';

import type {
  LoginCredentials,
  RegisterData,
  ChangePasswordData,
  AuthResponse,
  RegisterResponse,
  ProfileResponse,
} from '@/types/auth';

export const AUTH_ENDPOINTS = {
  register: '/auth/register',
  login: '/auth/login',
  logout: '/auth/logout',
  refresh: '/auth/refresh',
  me: '/auth/me',
  changePassword: '/auth/me/password',
} as const;

export const authService = {
  register(data: RegisterData) {
    return api.post<RegisterResponse>(AUTH_ENDPOINTS.register, data);
  },

  login(credentials: LoginCredentials) {
    return api.post<AuthResponse>(AUTH_ENDPOINTS.login, credentials);
  },

  logout(refreshToken?: string) {
    return api.post(
      AUTH_ENDPOINTS.logout,
      refreshToken ? { refreshToken } : {}
    );
  },

  refresh(refreshToken?: string) {
    return api.post<AuthResponse>(
      AUTH_ENDPOINTS.refresh,
      refreshToken ? { refreshToken } : {}
    );
  },

  getMe() {
    return api.get<ProfileResponse>(AUTH_ENDPOINTS.me);
  },

  changePassword(data: ChangePasswordData) {
    return api.patch(AUTH_ENDPOINTS.changePassword, data);
  },
};
