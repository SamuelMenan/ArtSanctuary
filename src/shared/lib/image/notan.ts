// Notan: simplificación tonal a 2 o 3 valores sobre píxeles reales.
// Funciones puras (sin DOM): operan sobre buffers RGBA, así que se prueban en
// Node y se reutilizan desde cualquier herramienta de imagen.

/** 2 valores (negro/blanco) o 3 valores (negro/gris medio/blanco). */
export type NotanMode = 2 | 3

export const NOTAN_BLACK = 0
/** Gris medio del modo de 3 valores: RGB(128, 128, 128). */
export const NOTAN_MID_GRAY = 128
export const NOTAN_WHITE = 255
/**
 * Semiancho de la banda de gris en el modo de 3 valores. Con umbral U, el gris
 * cubre las luminancias en [U − 32, U + 32).
 */
export const NOTAN_MID_BAND = 32

export const NOTAN_THRESHOLD_MIN = 0
export const NOTAN_THRESHOLD_MAX = 255
export const NOTAN_THRESHOLD_DEFAULT = 128

/** Lado largo máximo (px) de la imagen de trabajo. Mayor → se reduce. */
export const NOTAN_MAX_DIM = 2048

export interface NotanOptions {
  /** Entero 0–255. */
  threshold: number
  mode: NotanMode
}

/**
 * Luminancia percibida (Rec. 601), 0–255, sin corrección gamma.
 * Se calcula con enteros para que el blanco puro dé exactamente 255.
 */
export function luminance(r: number, g: number, b: number): number {
  return (299 * r + 587 * g + 114 * b) / 1000
}

/** Luminancia de cada píxel de un buffer RGBA (un valor por píxel). */
export function computeLuminance(rgba: Uint8ClampedArray): Float32Array {
  if (rgba.length % 4 !== 0) {
    throw new RangeError(`RGBA buffer length must be a multiple of 4 (got ${rgba.length})`)
  }
  const lum = new Float32Array(rgba.length / 4)
  for (let p = 0, i = 0; p < lum.length; p++, i += 4) {
    lum[p] = luminance(rgba[i], rgba[i + 1], rgba[i + 2])
  }
  return lum
}

/** Lleva un valor de slider al rango 0–255 (entero). Rechaza NaN/Infinity. */
export function clampThreshold(value: number): number {
  if (!Number.isFinite(value)) throw new RangeError(`Invalid threshold: ${value}`)
  return Math.min(NOTAN_THRESHOLD_MAX, Math.max(NOTAN_THRESHOLD_MIN, Math.round(value)))
}

function assertOptions({ threshold, mode }: NotanOptions): void {
  if (!Number.isInteger(threshold) || threshold < NOTAN_THRESHOLD_MIN || threshold > NOTAN_THRESHOLD_MAX) {
    throw new RangeError(`Threshold must be an integer between 0 and 255 (got ${threshold})`)
  }
  if (mode !== 2 && mode !== 3) throw new RangeError(`Mode must be 2 or 3 (got ${mode})`)
}

/**
 * Valor tonal de una luminancia.
 *  - Modo 2: L < U → negro; L ≥ U → blanco.
 *  - Modo 3: L < U − 32 → negro; U − 32 ≤ L < U + 32 → gris; L ≥ U + 32 → blanco.
 */
export function notanTone(lum: number, { threshold, mode }: NotanOptions): number {
  if (mode === 2) return lum < threshold ? NOTAN_BLACK : NOTAN_WHITE
  if (lum < threshold - NOTAN_MID_BAND) return NOTAN_BLACK
  if (lum < threshold + NOTAN_MID_BAND) return NOTAN_MID_GRAY
  return NOTAN_WHITE
}

/**
 * Escribe en `out` el Notan de la imagen. Lee la luminancia precalculada y copia
 * el canal alfa de `source` sin cambios. No muta `lum` ni `source`.
 */
export function applyNotan(
  lum: Float32Array,
  source: Uint8ClampedArray,
  out: Uint8ClampedArray,
  options: NotanOptions,
): void {
  assertOptions(options)
  if (source.length !== lum.length * 4 || out.length !== source.length) {
    throw new RangeError('Buffer sizes do not match (lum × 4 = source = out)')
  }
  for (let p = 0, i = 0; p < lum.length; p++, i += 4) {
    const v = notanTone(lum[p], options)
    out[i] = v
    out[i + 1] = v
    out[i + 2] = v
    out[i + 3] = source[i + 3]
  }
}

/** Dimensiones que caben en `max` px de lado largo, conservando proporción. */
export function fitWithin(
  width: number,
  height: number,
  max: number = NOTAN_MAX_DIM,
): { width: number; height: number; scaled: boolean } {
  if (!(width > 0) || !(height > 0)) throw new RangeError(`Invalid size ${width}×${height}`)
  const long = Math.max(width, height)
  if (long <= max) return { width, height, scaled: false }
  const r = max / long
  return { width: Math.max(1, Math.round(width * r)), height: Math.max(1, Math.round(height * r)), scaled: true }
}

/** Nombre del PNG descargado, p. ej. `notan-3-valores-umbral-128.png`. */
export function notanFileName({ mode, threshold }: NotanOptions): string {
  assertOptions({ mode, threshold })
  return `notan-${mode}-valores-umbral-${threshold}.png`
}
