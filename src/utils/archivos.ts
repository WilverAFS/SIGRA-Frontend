// src/utils/archivos.ts
import type { ValidationResult } from './validaciones';

/** Tamaño máximo por archivo (contrato 5.2): 25 MB. */
export const MAX_FILE_BYTES = 25 * 1024 * 1024;

/**
 * Tipos permitidos (contrato 5.3): PDF, Word, PowerPoint y Excel. La
 * extensión y el tipo MIME deben coincidir.
 */
export const ALLOWED_FILE_TYPES: Record<string, string[]> = {
  pdf: ['application/pdf'],
  doc: ['application/msword'],
  docx: [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  ppt: ['application/vnd.ms-powerpoint'],
  pptx: [
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
  xls: ['application/vnd.ms-excel'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
};

/** Valor para el atributo `accept` del input de archivo. */
export const FILE_ACCEPT = Object.keys(ALLOWED_FILE_TYPES)
  .map((ext) => `.${ext}`)
  .join(',');

function extension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
}

/**
 * Validar el archivo antes de subirlo. Devuelve `null` o el mensaje de
 * error en español, igual que el resto de `validaciones.ts`. El backend
 * vuelve a validar (413 / 415).
 */
export function archivoValido(file: File | null): ValidationResult {
  if (!file) {
    return 'Selecciona un archivo.';
  }
  const allowedMimes = ALLOWED_FILE_TYPES[extension(file.name)];
  // Algunos navegadores no informan el MIME de .doc/.xls: se acepta vacío
  if (!allowedMimes || (file.type && !allowedMimes.includes(file.type))) {
    return 'Tipo de archivo no permitido. Usa PDF, Word, PowerPoint o Excel.';
  }
  if (file.size <= 0) {
    return 'El archivo está vacío.';
  }
  if (file.size > MAX_FILE_BYTES) {
    return 'El archivo supera el máximo de 25 MB.';
  }
  return null;
}

/** Tamaño legible: 490204 → "478.7 KB". */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}

/**
 * Nombre del archivo desde `Content-Disposition` (filename* o filename).
 */
export function fileNameFromDisposition(
  header: string | undefined,
  fallback: string,
): string {
  if (!header) {
    return fallback;
  }
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (encoded) {
    try {
      return decodeURIComponent(encoded[1].trim());
    } catch {
      // nombre mal codificado: se usa el simple
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain ? plain[1].trim() : fallback;
}

/** Guardar un Blob como archivo descargado en el navegador. */
export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
