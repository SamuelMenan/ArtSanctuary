// Validación de archivos y estado de la vista de Notan. Puro (sin DOM) para
// poder probarlo en Node; la pantalla solo traduce estos códigos a textos.

export const NOTAN_ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const
/** Valor para el atributo `accept` del input de archivo. */
export const NOTAN_ACCEPT_ATTR = NOTAN_ACCEPTED_TYPES.join(',')
/** Peso máximo del archivo elegido. */
export const NOTAN_MAX_FILE_BYTES = 25 * 1024 * 1024
/** Píxeles máximos de la imagen decodificada (evita agotar memoria). */
export const NOTAN_MAX_PIXELS = 40_000_000

/**
 * - `empty`: no hay imagen.
 * - `loading`: leyendo/decodificando el archivo.
 * - `processing`: imagen lista, primer cálculo del Notan en curso.
 * - `ready`: hay resultado válido.
 * - `error`: fallo de carga o de procesamiento (ver `NotanErrorCode`).
 */
export type NotanPhase = 'empty' | 'loading' | 'processing' | 'ready' | 'error'

export type NotanErrorCode =
  | 'missing' // no llegó archivo o está vacío
  | 'type' // formato no admitido
  | 'size' // archivo demasiado pesado
  | 'dimensions' // demasiados megapíxeles
  | 'decode' // el navegador no pudo leer la imagen
  | 'canvas' // sin contexto 2D
  | 'process' // fallo inesperado al procesar
  | 'download' // fallo al generar el PNG

export type NotanCheck = { ok: true } | { ok: false; error: NotanErrorCode }

/** Error con código conocido, para mapearlo a un mensaje sin catches genéricos. */
export class NotanError extends Error {
  readonly code: NotanErrorCode
  constructor(code: NotanErrorCode, message?: string) {
    super(message ?? code)
    this.name = 'NotanError'
    this.code = code
  }
}

/** Valida el archivo antes de leerlo: existencia, tipo y peso. */
export function validateImageFile(file: { type: string; size: number } | null | undefined): NotanCheck {
  if (!file || file.size === 0) return { ok: false, error: 'missing' }
  if (!(NOTAN_ACCEPTED_TYPES as readonly string[]).includes(file.type)) return { ok: false, error: 'type' }
  if (file.size > NOTAN_MAX_FILE_BYTES) return { ok: false, error: 'size' }
  return { ok: true }
}

/** Valida las dimensiones de la imagen ya decodificada. */
export function validateImageDimensions(width: number, height: number): NotanCheck {
  if (!(width > 0) || !(height > 0)) return { ok: false, error: 'decode' }
  if (width * height > NOTAN_MAX_PIXELS) return { ok: false, error: 'dimensions' }
  return { ok: true }
}

/** La descarga solo existe con un resultado válido en el canvas. */
export function canDownload(phase: NotanPhase): boolean {
  return phase === 'ready'
}

/** Mensaje de estado (no error) para el panel del resultado, o null. */
export function phaseMessageKey(phase: NotanPhase): string | null {
  switch (phase) {
    case 'empty':
      return 'notan.resultEmpty'
    case 'loading':
      return 'notan.loading'
    case 'processing':
      return 'notan.processing'
    case 'ready':
    case 'error':
      return null
  }
}

export function errorMessageKey(code: NotanErrorCode): string {
  return `notan.errors.${code}`
}
