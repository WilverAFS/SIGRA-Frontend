import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/services/api';
import type { UserProfile, LoginCredentials, AuthResponse } from '@/types/auth';

const TOKEN_KEY = 'sigra_token';
const USER_KEY = 'sigra_user';

export const useAuthStore = defineStore('auth', () => {
  // Estado
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY));
  const user = ref<UserProfile | null>(
    localStorage.getItem(USER_KEY)
      ? (JSON.parse(localStorage.getItem(USER_KEY) as string) as UserProfile)
      : null
  );
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  // Getters
  const isAuthenticated = computed<boolean>(() => Boolean(token.value && user.value));
  const fullName = computed<string>(() =>
    user.value ? `${user.value.firstName} ${user.value.lastName}` : ''
  );
  const isAdmin = computed<boolean>(() => user.value?.role === 'ADMIN');
  const isTeacher = computed<boolean>(() => user.value?.role === 'DOCENTE');
  const isStudent = computed<boolean>(() => user.value?.role === 'ESTUDIANTE');

  // Acciones
  function setSession(newToken: string, newUser: UserProfile) {
    token.value = newToken;
    user.value = newUser;
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
  }

  function clearSession() {
    token.value = null;
    user.value = null;
    error.value = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  async function login(credentials: LoginCredentials): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      const { accessToken, user: loggedUser } = response.data.data;
      setSession(accessToken, loggedUser);
      return true;
    } catch (err: any) {
      error.value =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'No se pudo iniciar sesión. Verifica tus credenciales.';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    try {
      if (token.value) {
        await api.post('/auth/logout');
      }
    } catch {
      // Si el token ya expiró en servidor, limpiamos la sesión local de todas formas
    } finally {
      clearSession();
    }
  }

  return {
    // State
    token,
    user,
    loading,
    error,
    // Getters
    isAuthenticated,
    fullName,
    isAdmin,
    isTeacher,
    isStudent,
    // Actions
    setSession,
    clearSession,
    login,
    logout,
  };
});