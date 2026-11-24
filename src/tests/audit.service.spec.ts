import { beforeEach, describe, expect, test, vi } from 'vitest';

import api from '@/services/api';
import { auditService } from '@/services/audit.service';

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

const auditLog = {
  id: 15,
  userId: 2,
  action: 'CREATE',
  entityName: 'Material',
  entityId: 10,
  metadata: { title: 'Material de prueba' },
  createdAt: '2026-11-23T18:00:00.000Z',
};

const pagination = {
  total: 1,
  page: 1,
  limit: 20,
  totalPages: 1,
};

const links = {
  self: '/api/v1/audit-logs?page=1',
  next: null,
  prev: null,
};

describe('auditService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('obtiene registros de auditoría con filtros y paginación', async () => {
    const filters = {
      page: 1,
      limit: 20,
      action: 'CREATE',
      entityName: 'Material',
    };

    vi.mocked(api.get).mockResolvedValue({
      data: {
        success: true,
        message: 'Registros obtenidos correctamente.',
        data: [auditLog],
        meta: pagination,
        links,
      },
    } as never);

    const result = await auditService.list(filters);

    expect(api.get).toHaveBeenCalledWith('/audit-logs', {
      params: filters,
    });

    expect(result).toEqual({
      data: [auditLog],
      meta: pagination,
      links,
    });
  });

  test('permite consultar los registros sin especificar filtros', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        success: true,
        message: 'Registros obtenidos correctamente.',
        data: [],
        meta: { ...pagination, total: 0, totalPages: 0 },
        links,
      },
    } as never);

    const result = await auditService.list();

    expect(api.get).toHaveBeenCalledWith('/audit-logs', {
      params: {},
    });
    expect(result.data).toEqual([]);
  });

  test('obtiene el detalle de un registro por su identificador', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        success: true,
        message: 'Registro obtenido correctamente.',
        data: auditLog,
      },
    } as never);

    const result = await auditService.getById(15);

    expect(api.get).toHaveBeenCalledWith('/audit-logs/15');
    expect(result).toEqual(auditLog);
  });

  test('propaga los errores del cliente API', async () => {
    vi.mocked(api.get).mockRejectedValue(
      new Error('Registro no encontrado')
    );

    await expect(auditService.getById(999)).rejects.toThrow(
      'Registro no encontrado'
    );
  });
});
