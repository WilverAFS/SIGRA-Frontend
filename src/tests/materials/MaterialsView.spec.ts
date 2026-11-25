import { mount } from '@vue/test-utils';
import { beforeEach, vi } from 'vitest';

const materials = vi.hoisted(() => ({ list: vi.fn() }));
const catalogs = vi.hoisted(() => ({ subjectOptions: vi.fn(), periodOptions: vi.fn() }));
vi.mock('@/services/materials.service', () => ({ materialsService: materials }));
vi.mock('@/services/catalogs.service', () => ({ catalogsService: catalogs }));

import MaterialsView from '@/views/materials/MaterialsView.vue';

import { apiError, flush, loginAs, makeMaterial, makeRouter } from './helpers';

const pageOf = (items: unknown[], totalPages = 1) => ({
  success: true,
  message: 'ok',
  data: items,
  meta: { total: items.length, page: 1, limit: 12, totalPages },
  links: { self: '', next: null, prev: null },
});

async function mountAs(role: 'ADMIN' | 'DOCENTE' | 'ESTUDIANTE') {
  const { pinia } = loginAs(role);
  const router = makeRouter(MaterialsView, '/materiales');
  await router.push('/materiales');
  const wrapper = mount(MaterialsView, { global: { plugins: [pinia, router] } });
  await flush();
  return wrapper;
}

describe('MaterialsView (6.8.1 listar y buscar)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    catalogs.subjectOptions.mockResolvedValue([
      { id: 3, code: 'DSD-2303', name: 'Desarrollo de Servicios Web' },
    ]);
    catalogs.periodOptions.mockResolvedValue([
      { id: 2, code: '2026-2', name: 'Agosto - Diciembre 2026' },
    ]);
  });

  test('muestra las tarjetas con tipo, materia, autor y versión', async () => {
    materials.list.mockResolvedValue(
      pageOf([makeMaterial(), makeMaterial({ id: 9, title: 'Rúbrica', materialType: 'EVALUACION' })]),
    );
    const wrapper = await mountAs('ESTUDIANTE');
    const cards = wrapper.findAll('.material-card');
    expect(cards).toHaveLength(2);
    expect(cards[0].text()).toContain('Planeación didáctica 2026-2');
    expect(cards[0].text()).toContain('DSD-2303');
    expect(cards[0].text()).toContain('Wilver Alfredo Flores Santiago');
    expect(cards[0].text()).toContain('v1');
    expect(cards[1].text()).toContain('Evaluación');
    expect(cards[0].find('a').attributes('href')).toBe('/materiales/8');
  });

  test('ESTUDIANTE no ve "Subir material" ni el filtro de visibilidad', async () => {
    materials.list.mockResolvedValue(pageOf([]));
    const wrapper = await mountAs('ESTUDIANTE');
    expect(wrapper.find('[data-test="new-material"]').exists()).toBe(false);
    expect(wrapper.find('#filter-visibility').exists()).toBe(false);
  });

  test('DOCENTE y ADMIN ven "Subir material" y el filtro de visibilidad', async () => {
    materials.list.mockResolvedValue(pageOf([]));
    for (const role of ['DOCENTE', 'ADMIN'] as const) {
      const wrapper = await mountAs(role);
      expect(wrapper.find('[data-test="new-material"]').attributes('href')).toBe('/materiales/nuevo');
      expect(wrapper.find('#filter-visibility').exists()).toBe(true);
    }
  });

  test('aplica búsqueda y filtros, y reinicia a la página 1', async () => {
    materials.list.mockResolvedValue(pageOf([]));
    const wrapper = await mountAs('DOCENTE');
    expect(materials.list).toHaveBeenLastCalledWith({
      page: 1, limit: 12, search: undefined, subjectId: undefined,
      academicPeriodId: undefined, materialType: undefined, visibility: undefined,
      sort: 'createdAt:desc',
    });
    await wrapper.find('#search').setValue('  planeación ');
    await wrapper.find('#filter-subject').setValue('3');
    await wrapper.find('#filter-type').setValue('PLANEACION');
    await wrapper.find('#filter-visibility').setValue('SOLO_DOCENTES');
    await wrapper.find('#filter-sort').setValue('downloadCount:desc');
    await wrapper.find('form').trigger('submit');
    await flush();
    expect(materials.list).toHaveBeenLastCalledWith({
      page: 1, limit: 12, search: 'planeación', subjectId: 3,
      academicPeriodId: undefined, materialType: 'PLANEACION',
      visibility: 'SOLO_DOCENTES', sort: 'downloadCount:desc',
    });
  });

  test('paginación: avanza de página', async () => {
    materials.list.mockResolvedValue(pageOf([makeMaterial()], 3));
    const wrapper = await mountAs('ESTUDIANTE');
    const next = wrapper.findAll('.pagination button')[1];
    await next.trigger('click');
    await flush();
    expect(materials.list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
  });

  test('estados vacío y de error', async () => {
    materials.list.mockResolvedValue(pageOf([]));
    expect((await mountAs('ESTUDIANTE')).text()).toContain('No se encontraron materiales');

    materials.list.mockRejectedValue(apiError(422, 'VALIDATION_ERROR', 'Filtro fuera de catálogo.'));
    expect((await mountAs('ESTUDIANTE')).text()).toContain('Filtro fuera de catálogo.');
  });

  test('si los catálogos fallan, la lista se muestra igual', async () => {
    catalogs.subjectOptions.mockRejectedValue(new Error('404'));
    materials.list.mockResolvedValue(pageOf([makeMaterial()]));
    const wrapper = await mountAs('DOCENTE');
    expect(wrapper.findAll('.material-card')).toHaveLength(1);
  });
});
