import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

const mockAuthService = vi.hoisted(() => ({
  login: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('@/services/auth.service', () => ({
  authService: mockAuthService,
}));

import { useAuthStore } from '@/stores/auth';
import { UserRole } from '@/types/roles';

const testUser = {
  id: 1,
  institutionalId: 'TEST001',
  firstName: 'Usuario',
  lastName: 'Prueba',
  email: 'usuario@sigra.test',
  role: UserRole.ADMIN,
  instituteId: 1,
  careerId: null,
  isActive: true,
};

describe('Store de autenticación', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
  });

  test('guarda el token y los datos del usuario al establecer sesión', () => {
    const authStore = useAuthStore();

    authStore.setSession('token-prueba', testUser);

    expect(authStore.isAuthenticated).toBe(true);
    expect(localStorage.getItem('sigra_token')).toBe('token-prueba');
    expect(JSON.parse(localStorage.getItem('sigra_user')!)).toEqual(testUser);
  });

  test('limpia el token y los datos al cerrar la sesión local', () => {
    const authStore = useAuthStore();

    authStore.setSession('token-prueba', testUser);
    authStore.clearSession();

    expect(authStore.isAuthenticated).toBe(false);
    expect(authStore.token).toBeNull();
    expect(authStore.user).toBeNull();
    expect(localStorage.getItem('sigra_token')).toBeNull();
    expect(localStorage.getItem('sigra_user')).toBeNull();
  });

  test('inicia sesión y guarda los datos recibidos del servicio', async () => {
    mockAuthService.login.mockResolvedValue({
      data: {
        data: {
          accessToken: 'token-login',
          user: testUser,
        },
      },
    });

    const authStore = useAuthStore();
    const result = await authStore.login({
      email: testUser.email,
      password: 'password-prueba',
    });

    expect(result).toBe(true);
    expect(authStore.isAuthenticated).toBe(true);
    expect(authStore.token).toBe('token-login');
    expect(authStore.user).toEqual(testUser);
    expect(authStore.loading).toBe(false);
  });

  test('conserva el mensaje de error si falla el inicio de sesión', async () => {
    mockAuthService.login.mockRejectedValue({
      response: {
        data: {
          message: 'Credenciales incorrectas',
        },
      },
    });

    const authStore = useAuthStore();
    const result = await authStore.login({
      email: testUser.email,
      password: 'incorrecta',
    });

    expect(result).toBe(false);
    expect(authStore.isAuthenticated).toBe(false);
    expect(authStore.error).toBe('Credenciales incorrectas');
    expect(authStore.loading).toBe(false);
  });

  test('elimina la sesión aunque falle la petición de logout', async () => {
    mockAuthService.logout.mockRejectedValue(new Error('Error de conexión'));

    const authStore = useAuthStore();
    authStore.setSession('token-prueba', testUser);

    await authStore.logout();

    expect(mockAuthService.logout).toHaveBeenCalledOnce();
    expect(authStore.isAuthenticated).toBe(false);
    expect(localStorage.getItem('sigra_token')).toBeNull();
    expect(localStorage.getItem('sigra_user')).toBeNull();
  });
});
