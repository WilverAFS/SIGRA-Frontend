import {
  obtenerCodigoError,
  obtenerErroresPorCampo,
} from '@/utils/errores-api';
import { crearError422 } from '@/tests/helpers/error422';

describe('errores-api', () => {

  test('obtenerErroresPorCampo convierte el arreglo de details en un mapa por campo', () => {
    expect(obtenerErroresPorCampo(crearError422())).toEqual({
      code: 'El código ya existe.',
      name: 'El nombre es obligatorio.',
    });
  });

  test('obtenerCodigoError devuelve el código de negocio', () => {
    expect(obtenerCodigoError(crearError422())).toBe('VALIDATION_ERROR');
  });

  test('un error que no es de Axios no produce errores por campo', () => {
    expect(obtenerErroresPorCampo(new Error('fallo'))).toEqual({});
    expect(obtenerCodigoError(new Error('fallo'))).toBeNull();
  });

});