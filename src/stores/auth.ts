import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

import type {
  UserProfile,
  LoginCredentials,
  RegisterData,
  ChangePasswordData,
} from '@/types/auth';

import { UserRole } from '@/types/roles';
import { authService } from '@/services/auth.service';

const TOKEN_KEY = 'sigra_token';
const USER_KEY = 'sigra_user';
const REFRESH_TOKEN_KEY = 'sigra_refresh_token';

type FieldErrors = Record<string, string>;

function readStoredUser(): UserProfile | null {
  try {
    const storedUser = localStorage.getItem(USER_KEY);
    return storedUser ? JSON.parse(storedUser) as UserProfile : null;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

function getErrorMessage(error: any): string {
  return error.response?.data?.message
    || error.response?.data?.error
    || 'Ocurrió un error. Inténtalo nuevamente.';
}

function getFieldErrors(error: any): FieldErrors {
  const data = error.response?.data;
  const details = data?.error?.details;

  if (Array.isArray(details)) {
    return Object.fromEntries(
      details
        .filter((item: any) => item?.field && item?.message)
        .map((item: any) => [
          String(item.field),
          String(item.message),
        ])
    );
  }

  const validationErrors =
    data?.errors
    ?? details
    ?? data?.data?.errors
    ?? {};

  return Object.fromEntries(
    Object.entries(validationErrors).map(([field, messages]) => [
      field,
      Array.isArray(messages)
        ? String(messages[0] ?? '')
        : String(messages),
    ])
  );
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(
    localStorage.getItem(TOKEN_KEY)
  );

  const refreshToken = ref<string | null>(
    localStorage.getItem(REFRESH_TOKEN_KEY)
  );

  const user = ref<UserProfile | null>(readStoredUser());

  const loading = ref(false);
  const error = ref<string | null>(null);
  const validationErrors = ref<FieldErrors>({});

  const isAuthenticated = computed(
    () => Boolean(token.value && user.value)
  );

  const fullName = computed(
    () => user.value
      ? `${user.value.firstName} ${user.value.lastName}`
      : ''
  );

  const isAdmin = computed(
    () => user.value?.role === UserRole.ADMIN
  );

  const isTeacher = computed(
    () => user.value?.role === UserRole.DOCENTE
  );

  const isStudent = computed(
    () => user.value?.role === UserRole.ESTUDIANTE
  );

  function setSession(
    newToken: string,
    newUser: UserProfile,
    newRefreshToken?: string
  ) {
    token.value = newToken;
    user.value = newUser;

    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));

    if (newRefreshToken) {
      refreshToken.value = newRefreshToken;
      localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
    } else {
      refreshToken.value = null;
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  }

  function clearSession() {
    token.value = null;
    refreshToken.value = null;
    user.value = null;
    error.value = null;
    validationErrors.value = {};

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  function clearErrors() {
    error.value = null;
    validationErrors.value = {};
  }

  async function login(
    credentials: LoginCredentials
  ): Promise<boolean> {
    loading.value = true;
    clearErrors();

    try {
      const response = await authService.login(credentials);
      const data = response.data.data;

      if (!data.user.isActive) {
        clearSession();
        error.value = 'Tu cuenta está pendiente de aprobación.';
        return false;
      }

      setSession(
        data.accessToken,
        data.user,
        data.refreshToken
      );

      return true;
    } catch (err: any) {
      error.value = getErrorMessage(err);
      validationErrors.value = getFieldErrors(err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function register(
    registration: RegisterData
  ): Promise<'active' | 'pending' | 'error'> {
    loading.value = true;
    clearErrors();

    try {
      const response = await authService.register(registration);
      const data = response.data.data;

      if (
        registration.role === UserRole.DOCENTE
        || !data.user.isActive
      ) {
        clearSession();
        return 'pending';
      }

      if (!data.accessToken) {
        error.value = 'El servidor no devolvió el token de acceso.';
        return 'error';
      }

      setSession(
        data.accessToken,
        data.user,
        data.refreshToken
      );

      return 'active';
    } catch (err: any) {
      error.value = getErrorMessage(err);
      validationErrors.value = getFieldErrors(err);
      return 'error';
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    try {
      if (token.value || refreshToken.value) {
        await authService.logout(refreshToken.value ?? undefined);
      }
    } catch {
      // La sesión local se elimina aunque falle el servidor.
    } finally {
      clearSession();
    }
  }

  async function refreshSession(): Promise<boolean> {
    if (!refreshToken.value) {
      clearSession();
      return false;
    }

    try {
      const response = await authService.refresh(
        refreshToken.value
      );

      const data = response.data.data;

      setSession(
        data.accessToken,
        data.user,
        data.refreshToken ?? refreshToken.value
      );

      return true;
    } catch {
      clearSession();
      return false;
    }
  }

  async function fetchMe(): Promise<boolean> {
    loading.value = true;
    clearErrors();

    try {
      const response = await authService.getMe();
      const profile = response.data.data;

      user.value = profile;
      localStorage.setItem(USER_KEY, JSON.stringify(profile));

      return true;
    } catch (err: any) {
      error.value = getErrorMessage(err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function changePassword(
    data: ChangePasswordData
  ): Promise<boolean> {
    loading.value = true;
    clearErrors();

    try {
      await authService.changePassword(data);
      return true;
    } catch (err: any) {
      error.value = getErrorMessage(err);
      validationErrors.value = getFieldErrors(err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  return {
    token,
    refreshToken,
    user,
    loading,
    error,
    validationErrors,
    isAuthenticated,
    fullName,
    isAdmin,
    isTeacher,
    isStudent,
    setSession,
    clearSession,
    clearErrors,
    login,
    register,
    logout,
    refreshSession,
    fetchMe,
    changePassword,
  };
});
