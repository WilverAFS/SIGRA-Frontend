import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

const mockAuthService = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
  getMe: vi.fn(),
  changePassword: vi.fn(),
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

const studentUser = {
  ...testUser,
  role: UserRole.ESTUDIANTE,
};

const teacherUser = {
  ...testUser,
  role: UserRole.DOCENTE,
  isActive: false,
};

const registration = {
  institutionalId: 'EST001',
  firstName: 'Estudiante',
  lastName: 'Prueba',
  email: 'estudiante@sigra.test',
  password: 'Password123!',
  role: UserRole.ESTUDIANTE,
  instituteId: 1,
  careerId: 1,
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

  test('guarda también el refresh token', () => {
    const authStore = useAuthStore();

    authStore.setSession('access-token', testUser, 'refresh-token');

    expect(authStore.refreshToken).toBe('refresh-token');
    expect(localStorage.getItem('sigra_refresh_token')).toBe('refresh-token');
  });

  test('limpia todos los datos al cerrar la sesión local', () => {
    const authStore = useAuthStore();

    authStore.setSession('token-prueba', testUser, 'refresh-token');
    authStore.clearSession();

    expect(authStore.isAuthenticated).toBe(false);
    expect(authStore.token).toBeNull();
    expect(authStore.refreshToken).toBeNull();
    expect(authStore.user).toBeNull();
    expect(localStorage.getItem('sigra_token')).toBeNull();
    expect(localStorage.getItem('sigra_user')).toBeNull();
    expect(localStorage.getItem('sigra_refresh_token')).toBeNull();
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

  test('conserva los errores 422 de los campos', async () => {
    mockAuthService.login.mockRejectedValue({
      response: {
        status: 422,
        data: {
          message: 'Datos inválidos',
          errors: {
            email: ['El correo no es válido.'],
            password: ['La contraseña es incorrecta.'],
          },
        },
      },
    });

    const authStore = useAuthStore();

    await authStore.login({
      email: 'incorrecto',
      password: '123',
    });

    expect(authStore.validationErrors.email).toBe('El correo no es válido.');
    expect(authStore.validationErrors.password).toBe('La contraseña es incorrecta.');
  });

  test('interpreta los errores 422 del backend en formato details', async () => {
    mockAuthService.register.mockRejectedValue({
      response: {
        status: 422,
        data: {
          message: 'Datos inválidos',
          error: {
            code: 'VALIDATION_ERROR',
            details: [
              { field: 'email', message: 'El correo no es válido.' },
              { field: 'careerId', message: 'La carrera es obligatoria.' },
            ],
          },
        },
      },
    });

    const authStore = useAuthStore();
    const result = await authStore.register(registration);

    expect(result).toBe('error');
    expect(authStore.validationErrors.email).toBe('El correo no es válido.');
    expect(authStore.validationErrors.careerId).toBe('La carrera es obligatoria.');
  });

  test('registra un estudiante activo e inicia su sesión', async () => {
    mockAuthService.register.mockResolvedValue({
      data: {
        data: {
          user: studentUser,
          accessToken: 'token-estudiante',
          refreshToken: 'refresh-estudiante',
        },
      },
    });

    const authStore = useAuthStore();
    const result = await authStore.register(registration);

    expect(result).toBe('active');
    expect(authStore.isAuthenticated).toBe(true);
    expect(authStore.token).toBe('token-estudiante');
    expect(authStore.user).toEqual(studentUser);
  });

  test('registra un docente y deja la cuenta pendiente de aprobación', async () => {
    mockAuthService.register.mockResolvedValue({
      data: {
        data: {
          user: teacherUser,
        },
      },
    });

    const authStore = useAuthStore();
    const result = await authStore.register({
      ...registration,
      role: UserRole.DOCENTE,
    });

    expect(result).toBe('pending');
    expect(authStore.isAuthenticated).toBe(false);
    expect(authStore.user).toBeNull();
  });

  test('conserva los errores de validación del registro', async () => {
    mockAuthService.register.mockRejectedValue({
      response: {
        data: {
          message: 'Datos inválidos',
          errors: {
            institutionalId: ['El identificador ya existe.'],
          },
        },
      },
    });

    const authStore = useAuthStore();
    const result = await authStore.register(registration);

    expect(result).toBe('error');
    expect(authStore.validationErrors.institutionalId)
      .toBe('El identificador ya existe.');
  });

  test('actualiza el token al renovar la sesión', async () => {
    const authStore = useAuthStore();
    authStore.setSession('token-anterior', testUser, 'refresh-anterior');

    mockAuthService.refresh.mockResolvedValue({
      data: {
        data: {
          accessToken: 'token-renovado',
          user: testUser,
          refreshToken: 'refresh-renovado',
        },
      },
    });

    const result = await authStore.refreshSession();

    expect(result).toBe(true);
    expect(authStore.token).toBe('token-renovado');
    expect(authStore.refreshToken).toBe('refresh-renovado');
    expect(localStorage.getItem('sigra_token')).toBe('token-renovado');
  });

  test('elimina la sesión si falla la renovación', async () => {
    const authStore = useAuthStore();
    authStore.setSession('token-anterior', testUser, 'refresh-anterior');
    mockAuthService.refresh.mockRejectedValue(new Error('Refresh inválido'));

    const result = await authStore.refreshSession();

    expect(result).toBe(false);
    expect(authStore.isAuthenticated).toBe(false);
  });

  test('obtiene y actualiza los datos del perfil', async () => {
    const authStore = useAuthStore();
    authStore.setSession('token-prueba', testUser);

    const updatedUser = {
      ...testUser,
      firstName: 'Nombre actualizado',
    };

    mockAuthService.getMe.mockResolvedValue({
      data: {
        data: updatedUser,
      },
    });

    const result = await authStore.fetchMe();

    expect(result).toBe(true);
    expect(authStore.user?.firstName).toBe('Nombre actualizado');
    expect(JSON.parse(localStorage.getItem('sigra_user')!).firstName)
      .toBe('Nombre actualizado');
  });

  test('permite cambiar la contraseña', async () => {
    mockAuthService.changePassword.mockResolvedValue({
      data: { success: true },
    });

    const authStore = useAuthStore();
    const result = await authStore.changePassword({
      currentPassword: 'Actual123!',
      newPassword: 'Nueva123!',
      newPasswordConfirmation: 'Nueva123!',
    });

    expect(result).toBe(true);
    expect(mockAuthService.changePassword).toHaveBeenCalledOnce();
  });

  test('elimina la sesión aunque falle la petición de logout', async () => {
    mockAuthService.logout.mockRejectedValue(new Error('Error de conexión'));

    const authStore = useAuthStore();
    authStore.setSession('token-prueba', testUser, 'refresh-para-revocar');

    await authStore.logout();

    expect(mockAuthService.logout).toHaveBeenCalledWith('refresh-para-revocar');
    expect(mockAuthService.logout).toHaveBeenCalledOnce();
    expect(authStore.isAuthenticated).toBe(false);
    expect(localStorage.getItem('sigra_token')).toBeNull();
    expect(localStorage.getItem('sigra_user')).toBeNull();
  });
});
