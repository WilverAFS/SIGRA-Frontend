import { beforeEach, vi } from 'vitest';

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));
vi.mock('@/services/api', () => ({ default: api }));

import { materialsService } from '@/services/materials.service';

import { makeMaterial, makeVersion } from './helpers';

const page = (data: unknown[]) => ({
  data: {
    success: true,
    message: 'ok',
    data,
    meta: { total: data.length, page: 1, limit: 20, totalPages: 1 },
    links: { self: '', next: null, prev: null },
  },
});
const ok = (data: unknown) => ({ data: { success: true, message: 'ok', data } });

describe('materialsService (6.8.1–6.8.10)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('list llama GET /materials sin filtros vacíos', async () => {
    api.get.mockResolvedValue(page([makeMaterial()]));
    const result = await materialsService.list({
      page: 2,
      search: 'planeación',
      subjectId: undefined,
      materialType: 'PLANEACION',
      sort: 'title:asc',
    });
    expect(api.get).toHaveBeenCalledWith('/materials', {
      params: { page: 2, search: 'planeación', materialType: 'PLANEACION', sort: 'title:asc' },
    });
    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  test('create envía multipart con los campos y el archivo', async () => {
    api.post.mockResolvedValue(ok(makeMaterial()));
    const file = new File(['%PDF'], 'plan.pdf', { type: 'application/pdf' });
    await materialsService.create(
      {
        subjectId: 3,
        academicPeriodId: 2,
        title: 'Plan',
        materialType: 'PLANEACION',
        description: '',
        changelog: 'Versión inicial.',
      },
      file,
    );
    const [url, form, config] = api.post.mock.calls[0];
    expect(url).toBe('/materials');
    expect(config.headers['Content-Type']).toBe('multipart/form-data');
    expect(form).toBeInstanceOf(FormData);
    expect(form.get('subjectId')).toBe('3');
    expect(form.get('materialType')).toBe('PLANEACION');
    expect(form.get('changelog')).toBe('Versión inicial.');
    expect(form.has('description')).toBe(false);
    expect((form.get('file') as File).name).toBe('plan.pdf');
  });

  test('get, update (PATCH) y remove', async () => {
    api.get.mockResolvedValue(ok(makeMaterial()));
    api.patch.mockResolvedValue(ok(makeMaterial({ title: 'Nuevo' })));
    api.delete.mockResolvedValue({ data: { success: true, message: 'Material eliminado.', data: null } });

    expect((await materialsService.get(8)).id).toBe(8);
    expect(api.get).toHaveBeenCalledWith('/materials/8');
    expect((await materialsService.update(8, { title: 'Nuevo' })).title).toBe('Nuevo');
    expect(api.patch).toHaveBeenCalledWith('/materials/8', { title: 'Nuevo' });
    expect(await materialsService.remove(8)).toBe('Material eliminado.');
    expect(api.delete).toHaveBeenCalledWith('/materials/8');
  });

  test('versiones: historial, obtener y subir una nueva', async () => {
    api.get.mockResolvedValueOnce(page([makeVersion({ versionNumber: 2 }), makeVersion()]));
    const history = await materialsService.listVersions(8, { limit: 100 });
    expect(api.get).toHaveBeenCalledWith('/materials/8/versions', { params: { limit: 100 } });
    expect(history.data.map((v) => v.versionNumber)).toEqual([2, 1]);

    api.get.mockResolvedValueOnce(ok(makeVersion({ versionNumber: 2 })));
    await materialsService.getVersion(8, 2);
    expect(api.get).toHaveBeenLastCalledWith('/materials/8/versions/2');

    api.post.mockResolvedValue(ok(makeVersion({ versionNumber: 3 })));
    const file = new File(['x'], 'v3.pdf', { type: 'application/pdf' });
    const created = await materialsService.createVersion(8, file, '  Ajuste de unidad 3 ');
    const [url, form] = api.post.mock.calls[0];
    expect(url).toBe('/materials/8/versions');
    expect(form.get('changelog')).toBe('Ajuste de unidad 3');
    expect(created.versionNumber).toBe(3);
  });

  test('descargas piden blob y toman el nombre de Content-Disposition', async () => {
    const blob = new Blob(['%PDF']);
    api.get.mockResolvedValue({
      data: blob,
      headers: { 'content-disposition': 'attachment; filename="plan-v2.pdf"' },
    });
    const current = await materialsService.downloadCurrent(8);
    expect(api.get).toHaveBeenCalledWith('/materials/8/download', { responseType: 'blob' });
    expect(current).toEqual({ blob, fileName: 'plan-v2.pdf' });

    await materialsService.downloadVersion(8, 1);
    expect(api.get).toHaveBeenLastCalledWith('/materials/8/versions/1/download', {
      responseType: 'blob',
    });
  });

  test('si la descarga falla, convierte el error JSON que llega como Blob', async () => {
    const body = { success: false, message: 'El material no existe.', data: null, error: { code: 'RESOURCE_NOT_FOUND' } };
    api.get.mockRejectedValue({
      response: { status: 404, data: new Blob([JSON.stringify(body)], { type: 'application/json' }) },
    });
    await expect(materialsService.downloadCurrent(99)).rejects.toMatchObject({
      response: { status: 404, data: body },
    });
  });
});
