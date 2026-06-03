// Motor de validación reglamentaria — soporta Zonas de Riesgo (Fase 6) e
// Inspector de Acreditación (Fase 7). Lógica pura, sin dependencias de UI.

import type { CarnavalAxis, CarnavalRule, DimRange } from './rules'

/**
 * Estado de cumplimiento de una medida:
 * - `ok`        cumple holgadamente
 * - `warn`      dentro de norma pero cerca de un límite (zona de advertencia)
 * - `under`     por debajo del mínimo (incumple)
 * - `over`      por encima del máximo (incumple)
 * - `mismatch`  valor exacto exigido no coincide (bases / espesores exactos)
 * - `na`        el eje no aplica en esta modalidad
 */
export type ComplianceStatus = 'ok' | 'warn' | 'under' | 'over' | 'mismatch' | 'na'

export type AxisResult = {
  axis: CarnavalAxis
  status: ComplianceStatus
  valueCm: number
  range: DimRange | undefined
  /** Mensaje legible para alertas contextuales (Fase 6). */
  message: string
}

/** Fracción del rango cerca de un límite que dispara `warn` (10%). */
export const WARN_BAND = 0.1
/** Tolerancia (cm) para valores "exactos" antes de marcar mismatch. */
export const EXACT_TOLERANCE_CM = 0.1

const fmt = (n: number) => `${Math.round(n * 100) / 100} cm`

/**
 * Valida un único valor (cm de boceto) contra el rango reglamentario de un eje.
 * `warnBand` permite ajustar el ancho de la zona de advertencia (0–1).
 */
export function validateAxis(
  axis: CarnavalAxis,
  valueCm: number,
  range: DimRange | undefined,
  warnBand = WARN_BAND,
): AxisResult {
  const base = { axis, valueCm, range }

  if (!range) {
    return { ...base, status: 'na', message: `${axis}: sin restricción para esta modalidad` }
  }

  // Valor exacto exigido (bases, espesores).
  if (range.exact != null) {
    const diff = Math.abs(valueCm - range.exact)
    if (diff <= EXACT_TOLERANCE_CM) {
      return { ...base, status: 'ok', message: `${axis}: exacto ${fmt(range.exact)} ✓` }
    }
    return {
      ...base,
      status: 'mismatch',
      message: `${axis}: debe ser exactamente ${fmt(range.exact)} (actual ${fmt(valueCm)})`,
    }
  }

  const { min, max } = range

  if (min != null && valueCm < min) {
    return { ...base, status: 'under', message: `${axis}: ${fmt(valueCm)} < mínimo ${fmt(min)}` }
  }
  if (max != null && valueCm > max) {
    return { ...base, status: 'over', message: `${axis}: ${fmt(valueCm)} > máximo ${fmt(max)}` }
  }

  // Dentro de norma: ¿zona de advertencia cerca de un límite?
  if (min != null && max != null) {
    const span = max - min
    const band = span * warnBand
    if (span > 0 && (valueCm - min <= band || max - valueCm <= band)) {
      return { ...base, status: 'warn', message: `${axis}: ${fmt(valueCm)} cerca del límite` }
    }
  } else if (max != null) {
    const band = max * warnBand
    if (max - valueCm <= band) {
      return { ...base, status: 'warn', message: `${axis}: ${fmt(valueCm)} cerca del máximo ${fmt(max)}` }
    }
  } else if (min != null) {
    const band = min * warnBand
    if (valueCm - min <= band) {
      return { ...base, status: 'warn', message: `${axis}: ${fmt(valueCm)} cerca del mínimo ${fmt(min)}` }
    }
  }

  return { ...base, status: 'ok', message: `${axis}: ${fmt(valueCm)} ✓` }
}

/** Medidas de boceto a validar (cm). Ejes ausentes se omiten. */
export type BocetoMeasures = Partial<Record<CarnavalAxis, number>>

export type BocetoReport = {
  results: AxisResult[]
  /** true si ningún eje está en under/over/mismatch. */
  compliant: boolean
  /** Porcentaje de ejes evaluados que cumplen (ok+warn). 0–100. */
  compliancePct: number
  /** Observaciones técnicas (mensajes de los ejes que no cumplen). */
  observations: string[]
}

/** ¿El estado cuenta como cumplimiento? (ok y warn cumplen; warn solo avisa). */
export function isCompliant(s: ComplianceStatus): boolean {
  return s === 'ok' || s === 'warn' || s === 'na'
}

/**
 * Valida un boceto completo contra una modalidad. Base para el Inspector (Fase 7).
 * Solo evalúa los ejes presentes en `measures`.
 */
export function validateBoceto(
  rule: CarnavalRule,
  measures: BocetoMeasures,
  warnBand = WARN_BAND,
): BocetoReport {
  const results: AxisResult[] = []
  for (const axis of ['alto', 'ancho', 'largo', 'espesor'] as CarnavalAxis[]) {
    const value = measures[axis]
    if (value == null) continue
    results.push(validateAxis(axis, value, rule.dims[axis], warnBand))
  }

  const evaluated = results.filter((r) => r.status !== 'na')
  const passing = evaluated.filter((r) => isCompliant(r.status))
  const compliant = evaluated.every((r) => isCompliant(r.status))
  const compliancePct = evaluated.length === 0 ? 100 : Math.round((passing.length / evaluated.length) * 100)
  const observations = results.filter((r) => !isCompliant(r.status)).map((r) => r.message)

  return { results, compliant, compliancePct, observations }
}

/** Color semántico de cada estado para zonas/alertas (tokens de tema). */
export const STATUS_COLOR: Record<ComplianceStatus, string> = {
  ok: 'var(--color-success, #16a34a)',
  warn: 'var(--color-warning, #d97706)',
  under: 'var(--color-error, #dc2626)',
  over: 'var(--color-error, #dc2626)',
  mismatch: 'var(--color-error, #dc2626)',
  na: 'var(--color-on-surface-variant, #71717a)',
}
