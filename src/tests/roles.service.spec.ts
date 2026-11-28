import api from '@/services/api';
import { rolesService } from '@/services/roles.service';

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('rolesService', () => {

  test('listar consulta GET /roles', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: [] } });

    await rolesService.listar();

    expect(api.get).toHaveBeenCalledWith('/roles');
  });

  test('obtener consulta GET /roles/:id', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: {} } });

    await rolesService.obtener(2);

    expect(api.get).toHaveBeenCalledWith('/roles/2');
  });

});