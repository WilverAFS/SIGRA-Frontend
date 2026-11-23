import { beforeEach, describe, expect, test, vi } from 'vitest';

import api from '@/services/api';
import { healthService } from '@/services/health.service';

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

const healthResponse = {
  status: 'ok' as const,
  version: '1.2.0',
  timestamp: '2026-11-23T18:00:00.000Z',
  services: {
    database: 'up' as const,
    cache: 'up' as const,
    queue: 'up' as const,
  },
};

describe('healthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('obtiene los datos cuando el backend responde correctamente', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        success: true,
        message: 'Servicio operativo.',
        data: healthResponse,
      },
    } as never);

    const result = await healthService.getHealth();

    expect(api.get).toHaveBeenCalledWith(
      '/health',
      expect.objectContaining({
        validateStatus: expect.any(Function),
      })
    );

    expect(result).toEqual(healthResponse);
    expect(result.status).toBe('ok');
  });

  test('recupera los datos cuando el backend responde HTTP 503', async () => {
    const degradedResponse = {
      ...healthResponse,
      status: 'degraded' as const,
      services: {
        database: 'up' as const,
        cache: 'down' as const,
        queue: 'up' as const,
      },
    };

    vi.mocked(api.get).mockResolvedValue({
      data: {
        success: false,
        message: 'Servicio degradado.',
        data: degradedResponse,
      },
    } as never);

    const result = await healthService.getHealth();

    expect(result.status).toBe('degraded');
    expect(result.services.cache).toBe('down');
    expect(result.services.database).toBe('up');
    expect(result.services.queue).toBe('up');
  });

  test('permite HTTP 200 y HTTP 503 mediante validateStatus', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        success: true,
        message: 'Servicio operativo.',
        data: healthResponse,
      },
    } as never);

    await healthService.getHealth();

    const options = vi.mocked(api.get).mock.calls[0][1];

    expect(options?.validateStatus?.(200)).toBe(true);
    expect(options?.validateStatus?.(503)).toBe(true);
    expect(options?.validateStatus?.(500)).toBe(false);
  });
});
