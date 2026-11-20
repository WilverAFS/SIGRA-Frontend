// src/services/auth.service.ts
import api from './api';

import type {
  LoginCredentials,
  AuthResponse,
} from '@/types/auth';

export const authService = {
  login(credentials: LoginCredentials) {
    return api.post<AuthResponse>(
      '/auth/login',
      credentials
    );
  },

  logout() {
    return api.post('/auth/logout');
  },
};