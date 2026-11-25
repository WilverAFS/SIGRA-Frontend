import { mount } from '@vue/test-utils';
import { beforeEach, vi } from 'vitest';

const materials = vi.hoisted(() => ({
  get: vi.fn(),
  remove: vi.fn(),
  downloadCurrent: vi.fn(),
  listVersions: vi.fn(),
  downloadVersion: vi.fn(),
  createVersion: vi.fn(),
}));
vi.mock('@/services/materials.service', () => ({ materialsService: materials }));
const archivos = vi.hoisted(() => ({ saveBlob: vi.fn() }));
vi.mock('@/utils/archivos', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/archivos')>()),
  saveBlob: archivos.saveBlob,
}));

import type { UserRole } from '@/types/roles';
import MaterialDetailView from '@/views/materials/MaterialDetailView.vue';

import {
  apiError,
  flush,
  loginAs,
  makeMaterial,
  makeRouter,
  makeVersion,
} from './helpers';

const versionsPage = {
  success: true,
  message: 'ok',
  data: [makeVersion({ versionNumber: 2, id: 22 }), makeVersion()],
  meta: { total: 2, page: 1, limit: 100, totalPages: 1 },
  links: { self: '', next: null, prev: null },
};

async function mountAs(role: UserRole, userId = 7) {
  const { pinia } = loginAs(role, userId);
  const router = makeRouter(MaterialDetailView, '/materiales/:id');
  await router.push('/materiales/8');
  const wrapper = mount(MaterialDetailView, { global: { plugins: [pinia, router] } });
  await flush();
  await flush();
  return { wrapper, router };
}

describe('MaterialDetailView (6.8.3–6.8.10)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    materials.get.mockResolvedValue(makeMaterial({ currentVersion: 2 }));
    materials.listVersions.mockResolvedValue(versionsPage);
  });

  test('muestra los datos y la versión vigente', async () => {
    const { wrapper } = await mountAs('ESTUDIANTE');
    expect(materials.get).toHaveBeenCalledWith(8);
    expect(wrapper.find('h1').text()).toBe('Planeación didáctica 2026-2');
    expect(wrapper.text()).toContain('v2');
    expect(wrapper.text()).toContain('planeacion.pdf');
  });

  test('ESTUDIANTE: solo descarga la vigente; sin historial ni edición', async () => {
    const { wrapper } = await mountAs('ESTUDIANTE');
    expect(wrapper.find('[data-test="download-current"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="edit-material"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="delete-material"]').exists()).toBe(false);
    expect(wrapper.find('.history').exists()).toBe(false);
    expect(wrapper.find('.new-version').exists()).toBe(false);
    expect(materials.listVersions).not.toHaveBeenCalled();
  });

  test('DOCENTE autor: edita, elimina, sube versiones y ve el historial', async () => {
    const { wrapper } = await mountAs('DOCENTE', 7);
    expect(wrapper.find('[data-test="edit-material"]').attributes('href')).toBe('/materiales/8/editar');
    expect(wrapper.find('[data-test="delete-material"]').exists()).toBe(true);
    expect(wrapper.find('.new-version').exists()).toBe(true);
    const items = wrapper.findAll('.version-item');
    expect(items).toHaveLength(2);
    expect(items[0].text()).toContain('Versión 2');
    expect(items[0].text()).toContain('Vigente');
  });

  test('DOCENTE que no es autor: ve el historial pero no puede editar', async () => {
    const { wrapper } = await mountAs('DOCENTE', 99);
    expect(wrapper.find('.history').exists()).toBe(true);
    expect(wrapper.find('[data-test="edit-material"]').exists()).toBe(false);
    expect(wrapper.find('.new-version').exists()).toBe(false);
  });

  test('ADMIN gestiona cualquier material', async () => {
    const { wrapper } = await mountAs('ADMIN', 1);
    expect(wrapper.find('[data-test="edit-material"]').exists()).toBe(true);
    expect(wrapper.find('.new-version').exists()).toBe(true);
  });

  test('descarga la vigente y una versión concreta', async () => {
    const blob = new Blob(['%PDF']);
    materials.downloadCurrent.mockResolvedValue({ blob, fileName: 'plan-v2.pdf' });
    materials.downloadVersion.mockResolvedValue({ blob, fileName: 'plan-v1.pdf' });
    const { wrapper } = await mountAs('DOCENTE', 7);

    await wrapper.find('[data-test="download-current"]').trigger('click');
    await flush();
    expect(materials.downloadCurrent).toHaveBeenCalledWith(8);
    expect(archivos.saveBlob).toHaveBeenCalledWith(blob, 'plan-v2.pdf');
    expect(wrapper.text()).toContain('5'); // downloadCount 4 → 5

    await wrapper.findAll('.version-item button')[1].trigger('click');
    await flush();
    expect(materials.downloadVersion).toHaveBeenCalledWith(8, 1);
    expect(archivos.saveBlob).toHaveBeenLastCalledWith(blob, 'plan-v1.pdf');
  });

  test('eliminar pide confirmación y regresa al listado', async () => {
    materials.remove.mockResolvedValue('Material eliminado.');
    const { wrapper, router } = await mountAs('DOCENTE', 7);
    await wrapper.find('[data-test="delete-material"]').trigger('click');
    expect(materials.remove).not.toHaveBeenCalled();
    await wrapper.find('[data-test="confirm-delete"]').trigger('click');
    await flush();
    expect(materials.remove).toHaveBeenCalledWith(8);
    expect(router.currentRoute.value.path).toBe('/materiales');
  });

  test('muestra el error de FORBIDDEN_OWNERSHIP al eliminar', async () => {
    materials.remove.mockRejectedValue(
      apiError(403, 'FORBIDDEN_OWNERSHIP', 'Solo el autor puede eliminar este material.'),
    );
    const { wrapper } = await mountAs('DOCENTE', 7);
    await wrapper.find('[data-test="delete-material"]').trigger('click');
    await wrapper.find('[data-test="confirm-delete"]').trigger('click');
    await flush();
    expect(wrapper.find('.action-error').text()).toBe('Solo el autor puede eliminar este material.');
  });

  test('404: material inexistente o no visible para el rol', async () => {
    materials.get.mockRejectedValue(apiError(404, 'RESOURCE_NOT_FOUND', 'No existe.'));
    const { wrapper } = await mountAs('ESTUDIANTE');
    expect(wrapper.text()).toContain('El material no existe o no tienes acceso a él.');
  });

  test('subir versión nueva: valida el archivo y recarga al terminar', async () => {
    materials.createVersion.mockResolvedValue(makeVersion({ versionNumber: 3 }));
    const { wrapper } = await mountAs('DOCENTE', 7);
    const form = wrapper.find('.new-version');

    await form.trigger('submit');
    expect(form.text()).toContain('Selecciona un archivo.');
    expect(materials.createVersion).not.toHaveBeenCalled();

    const file = new File(['%PDF'], 'v3.pdf', { type: 'application/pdf' });
    const input = wrapper.find('#version-file');
    Object.defineProperty(input.element, 'files', { value: [file] });
    await input.trigger('change');
    await wrapper.find('#version-changelog').setValue('Ajuste de la unidad 3');
    await form.trigger('submit');
    await flush();
    await flush();
    expect(materials.createVersion).toHaveBeenCalledWith(8, file, 'Ajuste de la unidad 3');
    expect(wrapper.text()).toContain('Se subió la versión 3.');
    expect(materials.get).toHaveBeenCalledTimes(2);
    expect(materials.listVersions).toHaveBeenCalledTimes(2);
  });

  test('subir versión sin asignación: mensaje de FORBIDDEN_SUBJECT_ASSIGNMENT', async () => {
    materials.createVersion.mockRejectedValue(
      apiError(403, 'FORBIDDEN_SUBJECT_ASSIGNMENT', 'Sin asignación.'),
    );
    const { wrapper } = await mountAs('DOCENTE', 7);
    const input = wrapper.find('#version-file');
    Object.defineProperty(input.element, 'files', {
      value: [new File(['x'], 'v3.pdf', { type: 'application/pdf' })],
    });
    await input.trigger('change');
    await wrapper.find('.new-version').trigger('submit');
    await flush();
    expect(wrapper.find('.new-version').text()).toContain('Ya no tienes asignada la materia');
  });
});
