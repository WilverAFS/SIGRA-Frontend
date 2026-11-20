// src/utils/validaciones.ts

export type ValidationResult = string | null;

export function requerido(value: string): ValidationResult {
    return value.trim() ? null : 'Este campo es obligatorio.';
}

export function soloLetras(value: string): ValidationResult {
    const regex = /^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ\s]+$/;

    return regex.test(value) ? null : 'Solo se permiten letras.';
}

export function soloNumeros(value: string): ValidationResult {
    const regex = /^\d+$/;

    return regex.test(value) ? null : 'Solo se permiten números.';
}

export function correoValido(value: string): ValidationResult {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return regex.test(value) ? null : 'Debe ingresar un correo electrónico válido.';
}

export function passwordSegura(value: string): ValidationResult {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

    return regex.test(value) ? null :
        'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.';
}

export function longitudMaxima(value: string, max: number): ValidationResult {
    return value.length <= max ? null : `No debe exceder ${max} caracteres.`;
}

export function longitudMinima(value: string, min: number): ValidationResult {
    return value.length >= min ? null : `Debe contener al menos ${min} caracteres.`;
}

