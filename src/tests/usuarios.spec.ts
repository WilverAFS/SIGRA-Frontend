import api from '@/services/api';
import { usuariosService } from '@/services/usuarios.service';

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('usuariosService', () => {

  test('listar consulta GET /users con los filtros', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: [] } });

    await usuariosService.listar({ page: 2, role: 'DOCENTE', isActive: false });

    expect(api.get).toHaveBeenCalledWith('/users', {
      params: { page: 2, role: 'DOCENTE', isActive: false },
    });
  });

  test('actualizar usa PATCH con solo los campos enviados', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { data: {} } });

    await usuariosService.actualizar(7, { isActive: true });

    expect(api.patch).toHaveBeenCalledWith('/users/7', { isActive: true });
  });

  test('eliminar usa DELETE /users/:id', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: { data: null } });

    await usuariosService.eliminar(7);

    expect(api.delete).toHaveBeenCalledWith('/users/7');
  });

});