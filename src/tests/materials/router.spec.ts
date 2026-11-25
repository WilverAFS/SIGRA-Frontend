import { vi } from 'vitest';

vi.mock('@/services/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

import router from '@/router';

import { loginAs } from './helpers';

describe('rutas de materiales (matriz 2.3)', () => {
  test('sin sesión → /login', async () => {
    loginAs(null);
    await router.push('/materiales');
    expect(router.currentRoute.value.path).toBe('/login');
  });

  test('ESTUDIANTE puede ver el catálogo y el detalle, pero no subir ni editar', async () => {
    loginAs('ESTUDIANTE');
    await router.push('/materiales');
    expect(router.currentRoute.value.path).toBe('/materiales');
    await router.push('/materiales/8');
    expect(router.currentRoute.value.name).toBe('MaterialDetail');
    await router.push('/materiales/nuevo');
    expect(router.currentRoute.value.path).toBe('/403');
    await router.push('/materiales/8/editar');
    expect(router.currentRoute.value.path).toBe('/403');
  });

  test('DOCENTE puede abrir el formulario de subida', async () => {
    loginAs('DOCENTE');
    await router.push('/materiales/nuevo');
    expect(router.currentRoute.value.name).toBe('MaterialCreate');
  });
});
