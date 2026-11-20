import {
  requerido,
  soloLetras,
  soloNumeros,
  correoValido,
  passwordSegura,
} from '@/utils/validaciones';

describe('validaciones', () => {

  test('required válido', () => {
    expect(
      requerido('SIGRA')
    ).toBeNull();
  });

  test('required inválido', () => {
    expect(
      requerido('')
    ).toBe(
      'Este campo es obligatorio.'
    );
  });

  test('solo letras válido', () => {
    expect(
      soloLetras('Juan Pérez')
    ).toBeNull();
  });

  test('solo números válido', () => {
    expect(
      soloNumeros('123456')
    ).toBeNull();
  });

  test('correo válido', () => {
    expect(
      correoValido('correo@test.com')
    ).toBeNull();
  });

  test('password válida', () => {
    expect(
      passwordSegura('Password123!')
    ).toBeNull();
  });
});
