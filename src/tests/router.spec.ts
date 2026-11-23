import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent } from 'vue';
import { UserRole } from '@/types/roles';

const mockAuthStore = vi.hoisted(() => ({
  isAuthenticated: false,
  user: null as { role: string } | null,
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => mockAuthStore,
}));

import router from '@/router';

describe('Protección de rutas', () => {
  beforeEach(async () => {
    mockAuthStore.isAuthenticated = false;
    mockAuthStore.user = null;
    await router.push('/health');
  });

  afterEach(() => {
    const testRoute = router.getRoutes().find(
      (route) => route.path === '/__admin-test'
    );

    if (testRoute) {
      router.removeRoute(testRoute.name!);
    }
  });

  test('redirige al login si no hay sesión y se intenta abrir el Dashboard', async () => {
    await router.push('/');

    expect(router.currentRoute.value.path).toBe('/login');
  });

  test.each([
    UserRole.ADMIN,
    UserRole.DOCENTE,
    UserRole.ESTUDIANTE,
  ])('permite entrar al Dashboard con el rol %s', async (role) => {
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.user = { role };

    await router.push('/');

    expect(router.currentRoute.value.path).toBe('/');
  });

  test('redirige al Dashboard si un usuario autenticado intenta abrir el login', async () => {
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.user = { role: UserRole.ADMIN };

    await router.push('/login');

    expect(router.currentRoute.value.path).toBe('/');
  });

  test('redirige a 403 cuando el usuario no tiene el rol requerido', async () => {
    router.addRoute({
      path: '/__admin-test',
      name: '__admin-test',
      component: defineComponent({ template: '<div>Prueba</div>' }),
      meta: {
        requiresAuth: true,
        roles: [UserRole.ADMIN],
      },
    });

    mockAuthStore.isAuthenticated = true;
    mockAuthStore.user = { role: UserRole.ESTUDIANTE };

    await router.push('/__admin-test');

    expect(router.currentRoute.value.path).toBe('/403');
  });

  test('permite consultar Health Check sin iniciar sesión', async () => {
    await router.push('/health');

    expect(router.currentRoute.value.path).toBe('/health');
  });
});
