import { mount } from '@vue/test-utils';
import { beforeEach, vi } from 'vitest';

const materials = vi.hoisted(() => ({ get: vi.fn(), create: vi.fn(), update: vi.fn() }));
const catalogs = vi.hoisted(() => ({ subjectOptions: vi.fn(), periodOptions: vi.fn() }));
vi.mock('@/services/materials.service', () => ({ materialsService: materials }));
vi.mock('@/services/catalogs.service', () => ({ catalogsService: catalogs }));

import type { UserRole } from '@/types/roles';
import MaterialFormView from '@/views/materials/MaterialFormView.vue';

import { apiError, flush, loginAs, makeMaterial, makeRouter } from './helpers';

async function mountForm(role: UserRole, path: string, userId = 7) {
  const { pinia } = loginAs(role, userId);
  const pattern = path.endsWith('editar') ? '/materiales/:id/editar' : '/materiales/nuevo';
  const router = makeRouter(MaterialFormView, pattern);
  await router.push(path);
  const wrapper = mount(MaterialFormView, { global: { plugins: [pinia, router] } });
  await flush();
  await flush();
  return { wrapper, router };
}

async function fillCreateForm(wrapper: Awaited<ReturnType<typeof mountForm>>['wrapper']) {
  await wrapper.find('#subjectId').setValue('3');
  await wrapper.find('#academicPeriodId').setValue('2');
  await wrapper.find('#title').setValue('  Planeación 2026-2 ');
  await wrapper.find('#materialType').setValue('PLANEACION');
  const input = wrapper.find('#file');
  Object.defineProperty(input.element, 'files', {
    value: [new File(['%PDF'], 'plan.pdf', { type: 'application/pdf' })],
  });
  await input.trigger('change');
}

describe('MaterialFormView: subir material (6.8.2)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    catalogs.subjectOptions.mockResolvedValue([
      { id: 3, code: 'DSD-2303', name: 'Desarrollo de Servicios Web' },
    ]);
    catalogs.periodOptions.mockResolvedValue([
      { id: 2, code: '2026-2', name: 'Agosto - Diciembre 2026' },
    ]);
  });

  test('valida en el cliente antes de enviar (obligatorios y archivo)', async () => {
    const { wrapper } = await mountForm('DOCENTE', '/materiales/nuevo');
    await wrapper.find('form').trigger('submit');
    expect(materials.create).not.toHaveBeenCalled();
    for (const id of ['subjectId', 'academicPeriodId', 'title', 'materialType']) {
      expect(wrapper.find(`#${id}-error`).text()).toBe('Este campo es obligatorio.');
    }
    expect(wrapper.find('#file-error').text()).toBe('Selecciona un archivo.');
  });

  test('rechaza un título de más de 220 caracteres', async () => {
    const { wrapper } = await mountForm('DOCENTE', '/materiales/nuevo');
    await fillCreateForm(wrapper);
    await wrapper.find('#title').setValue('a'.repeat(221));
    await wrapper.find('form').trigger('submit');
    expect(wrapper.find('#title-error').text()).toBe('No debe exceder 220 caracteres.');
    expect(materials.create).not.toHaveBeenCalled();
  });

  test('crea el material y navega a su detalle', async () => {
    materials.create.mockResolvedValue(makeMaterial({ id: 15 }));
    const { wrapper, router } = await mountForm('DOCENTE', '/materiales/nuevo');
    await fillCreateForm(wrapper);
    await wrapper.find('form').trigger('submit');
    await flush();
    const [fields, file] = materials.create.mock.calls[0];
    expect(fields).toEqual({
      subjectId: 3,
      academicPeriodId: 2,
      title: 'Planeación 2026-2',
      description: undefined,
      materialType: 'PLANEACION',
      visibility: 'ESTUDIANTES_Y_DOCENTES',
      syllabusChangesNote: undefined,
      changelog: 'Versión inicial.',
    });
    expect(file.name).toBe('plan.pdf');
    expect(router.currentRoute.value.path).toBe('/materiales/15');
  });

  test('muestra los errores 422 del backend junto a cada campo', async () => {
    materials.create.mockRejectedValue(
      apiError(422, 'VALIDATION_ERROR', 'Los datos enviados no son válidos.', [
        { field: 'title', message: 'Ya existe un material con ese título.' },
        { field: 'academicPeriodId', message: 'El periodo no existe.' },
      ]),
    );
    const { wrapper } = await mountForm('DOCENTE', '/materiales/nuevo');
    await fillCreateForm(wrapper);
    await wrapper.find('form').trigger('submit');
    await flush();
    expect(wrapper.find('#title-error').text()).toBe('Ya existe un material con ese título.');
    expect(wrapper.find('#academicPeriodId-error').text()).toBe('El periodo no existe.');
    expect(wrapper.find('.server-error').exists()).toBe(false);
  });

  test('413 y 415 se muestran junto al archivo', async () => {
    materials.create.mockRejectedValue(
      apiError(415, 'FILE_TYPE_NOT_ALLOWED', 'Tipo de archivo no permitido.'),
    );
    const { wrapper } = await mountForm('DOCENTE', '/materiales/nuevo');
    await fillCreateForm(wrapper);
    await wrapper.find('form').trigger('submit');
    await flush();
    expect(wrapper.find('#file-error').text()).toBe('Tipo de archivo no permitido.');
  });

  test('docente sin la materia asignada: mensaje de FORBIDDEN_SUBJECT_ASSIGNMENT', async () => {
    materials.create.mockRejectedValue(
      apiError(403, 'FORBIDDEN_SUBJECT_ASSIGNMENT', 'Sin asignación.'),
    );
    const { wrapper } = await mountForm('DOCENTE', '/materiales/nuevo');
    await fillCreateForm(wrapper);
    await wrapper.find('form').trigger('submit');
    await flush();
    expect(wrapper.find('.server-error').text()).toContain('No tienes asignada esta materia');
  });
});

describe('MaterialFormView: editar material (6.8.4)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    materials.get.mockResolvedValue(makeMaterial({ authorId: 7, isApproved: false }));
  });

  test('carga los datos, no pide archivo y envía PATCH solo con los datos', async () => {
    materials.update.mockResolvedValue(makeMaterial());
    const { wrapper, router } = await mountForm('DOCENTE', '/materiales/8/editar', 7);
    expect((wrapper.find('#title').element as HTMLInputElement).value).toBe(
      'Planeación didáctica 2026-2',
    );
    expect(wrapper.find('#file').exists()).toBe(false);
    expect(wrapper.find('#subjectId').exists()).toBe(false);
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false);

    await wrapper.find('#title').setValue('Planeación corregida');
    await wrapper.find('form').trigger('submit');
    await flush();
    expect(materials.update).toHaveBeenCalledWith(8, {
      title: 'Planeación corregida',
      description: 'Planeación por unidades.',
      materialType: 'PLANEACION',
      visibility: 'ESTUDIANTES_Y_DOCENTES',
      syllabusChangesNote: null,
    });
    expect(router.currentRoute.value.path).toBe('/materiales/8');
  });

  test('ADMIN puede aprobar el material (isApproved)', async () => {
    materials.update.mockResolvedValue(makeMaterial());
    const { wrapper } = await mountForm('ADMIN', '/materiales/8/editar', 1);
    const checkbox = wrapper.find('input[type="checkbox"]');
    expect(checkbox.exists()).toBe(true);
    await checkbox.setValue(true);
    await wrapper.find('form').trigger('submit');
    await flush();
    expect(materials.update.mock.calls[0][1]).toMatchObject({ isApproved: true });
  });

  test('un DOCENTE que no es autor es enviado a 403', async () => {
    const { router } = await mountForm('DOCENTE', '/materiales/8/editar', 99);
    expect(router.currentRoute.value.path).toBe('/403');
  });
});
