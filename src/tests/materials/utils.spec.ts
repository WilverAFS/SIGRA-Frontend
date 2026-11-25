import {
  archivoValido,
  fileNameFromDisposition,
  formatBytes,
  MAX_FILE_BYTES,
} from '@/utils/archivos';
import {
  getErrorCode,
  getErrorMessage,
  getFieldError,
} from '@/utils/error-handler';
import {
  puedeCrearMaterial,
  puedeFiltrarVisibilidad,
  puedeGestionarMaterial,
  puedeVerHistorial,
} from '@/utils/permisos-materiales';

import { apiError, makeUser } from './helpers';

const fileOf = (name: string, type: string, size: number) => {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('archivoValido (5.2: tipos permitidos y máximo 25 MB)', () => {
  test.each([
    ['planeacion.pdf', 'application/pdf'],
    ['apunte.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ['clase.PPTX', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    ['rubrica.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    ['viejo.doc', ''],
  ])('acepta %s', (name, type) => {
    expect(archivoValido(fileOf(name, type, 1000))).toBeNull();
  });

  test('pide un archivo si no hay', () => {
    expect(archivoValido(null)).toBe('Selecciona un archivo.');
  });

  test('rechaza extensiones o tipos MIME no permitidos', () => {
    expect(archivoValido(fileOf('foto.png', 'image/png', 1000))).toMatch(/no permitido/);
    expect(archivoValido(fileOf('truco.pdf', 'image/png', 1000))).toMatch(/no permitido/);
    expect(archivoValido(fileOf('sin-extension', '', 1000))).toMatch(/no permitido/);
  });

  test('rechaza archivos vacíos y de más de 25 MB', () => {
    expect(archivoValido(fileOf('a.pdf', 'application/pdf', 0))).toBe('El archivo está vacío.');
    expect(archivoValido(fileOf('a.pdf', 'application/pdf', MAX_FILE_BYTES))).toBeNull();
    expect(archivoValido(fileOf('a.pdf', 'application/pdf', MAX_FILE_BYTES + 1))).toBe(
      'El archivo supera el máximo de 25 MB.',
    );
  });

  test('formatBytes y nombre de Content-Disposition', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(490204)).toBe('478.7 KB');
    expect(formatBytes(3 * 1024 * 1024)).toBe('3.0 MB');
    expect(fileNameFromDisposition('attachment; filename="plan v2.pdf"', 'x')).toBe('plan v2.pdf');
    expect(
      fileNameFromDisposition("attachment; filename*=UTF-8''planeaci%C3%B3n.pdf", 'x'),
    ).toBe('planeación.pdf');
    expect(fileNameFromDisposition(undefined, 'material-8')).toBe('material-8');
  });
});

describe('error-handler (contrato cap. 4)', () => {
  test('lee error.details como lista [{ field, message }]', () => {
    const err = apiError(422, 'VALIDATION_ERROR', 'Datos inválidos', [
      { field: 'title', message: 'Este campo es obligatorio.' },
    ]);
    expect(getFieldError(err, 'title')).toBe('Este campo es obligatorio.');
    expect(getFieldError(err, 'file')).toBeNull();
    expect(getErrorCode(err)).toBe('VALIDATION_ERROR');
    expect(getErrorMessage(err)).toBe('Datos inválidos');
  });

  test('sigue aceptando el formato anterior { campo: [mensajes] }', () => {
    const err = { response: { data: { error: { details: { email: ['Correo inválido'] } } } } };
    expect(getFieldError(err, 'email')).toBe('Correo inválido');
  });

  test('sin respuesta del servidor muestra un mensaje de conexión', () => {
    expect(getErrorMessage(new Error('Network Error'))).toMatch(/conectar con el servidor/);
  });
});

describe('permisos de materiales (matriz 2.3)', () => {
  const material = { authorId: 7 };

  test('ESTUDIANTE: solo consulta', () => {
    const user = makeUser('ESTUDIANTE', 7);
    expect(puedeCrearMaterial(user)).toBe(false);
    expect(puedeGestionarMaterial(user, material)).toBe(false);
    expect(puedeVerHistorial(user)).toBe(false);
    expect(puedeFiltrarVisibilidad(user)).toBe(false);
  });

  test('DOCENTE: crea; edita solo sus materiales; ve el historial', () => {
    expect(puedeCrearMaterial(makeUser('DOCENTE', 7))).toBe(true);
    expect(puedeGestionarMaterial(makeUser('DOCENTE', 7), material)).toBe(true);
    expect(puedeGestionarMaterial(makeUser('DOCENTE', 9), material)).toBe(false);
    expect(puedeVerHistorial(makeUser('DOCENTE', 9))).toBe(true);
  });

  test('ADMIN: acceso total; sin sesión: nada', () => {
    expect(puedeGestionarMaterial(makeUser('ADMIN', 1), material)).toBe(true);
    expect(puedeCrearMaterial(null)).toBe(false);
    expect(puedeGestionarMaterial(null, material)).toBe(false);
  });
});
