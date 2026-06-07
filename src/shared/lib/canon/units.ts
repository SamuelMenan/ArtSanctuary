// Conversión de unidades para la herramienta Canon. Todo el modelo trabaja en cm;
// esto sólo formatea para mostrar. `headCm` es la unidad-cabeza vigente (depende
// del canon + altura), necesaria para expresar en "cabezas".

export type Unit = 'cm' | 'in' | 'heads'

export const UNITS: Unit[] = ['cm', 'in', 'heads']

const CM_PER_IN = 2.54

/** Convierte cm al valor numérico en la unidad pedida. */
export function convert(cm: number, unit: Unit, headCm: number): number {
  if (unit === 'in') return cm / CM_PER_IN
  if (unit === 'heads') return headCm > 0 ? cm / headCm : 0
  return cm
}

/** Decimales recomendados por unidad. */
export function unitDecimals(unit: Unit): number {
  return unit === 'heads' ? 2 : 1
}

/** Valor formateado SIN sufijo (el sufijo localizado lo pone la UI vía i18n). */
export function formatValue(cm: number, unit: Unit, headCm: number): string {
  return convert(cm, unit, headCm).toFixed(unitDecimals(unit))
}
