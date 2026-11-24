import { beforeEach, describe, expect, test, vi } from 'vitest';

import api from '@/services/api';
import { dashboardService } from '@/services/dashboard.service';

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

const dashboardResponse = {
  currentPeriod: {
    id: 1,
    code: '2026-1',
    name: 'Enero - Junio 2026',
  },
  counts: {
    activeCareers: 5,
    activeSubjects: 30,
    visibleMaterials: 120,
    myAssignments: 8,
    myMaterials: 12,
  },
  recentMaterials: [],
};

describe('dashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('consulta el resumen del Dashboard y devuelve los datos', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        success: true,
        message: 'Resumen obtenido correctamente.',
        data: dashboardResponse,
      },
    } as never);

    const result = await dashboardService.getSummary();

    expect(api.get).toHaveBeenCalledWith('/dashboard/summary');
    expect(result).toEqual(dashboardResponse);
    expect(result.counts.activeCareers).toBe(5);
    expect(result.counts.visibleMaterials).toBe(120);
  });

  test('propaga los errores del cliente API', async () => {
    const error = new Error('Error del servidor');

    vi.mocked(api.get).mockRejectedValue(error);

    await expect(dashboardService.getSummary()).rejects.toThrow(
      'Error del servidor'
    );
  });
});
