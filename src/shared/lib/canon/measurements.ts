// Medidas anatómicas detalladas derivadas del modelo. Los LARGOS usan ratios
// clásicos en unidades-cabeza (constantes entre cánones); los ANCHOS vienen del
// canon. Todo escala con `headCm`, así que cambia con altura y canon. La
// etiqueta visible vive en i18n (`canon.measure.<key>`), no aquí.

import type { FigureModel } from './figure'

export type MeasureGroup = 'unit' | 'width' | 'length'

/** Rango anatómico de referencia en unidades-cabeza. */
export interface AnatomyRef {
  min: number
  max: number
}

export interface Measurement {
  key: string
  /** Tamaño en unidades-cabeza (valor CANÓNICO, inmutable). */
  heads: number
  /** Tamaño en cm reales. */
  cm: number
  group: MeasureGroup
  /** Rango de referencia anatómica (Capa de análisis), si aplica. */
  ref?: AnatomyRef
  /** Desviación del canon respecto al centro del rango anatómico (cabezas).
   *  + = el canon es mayor que la referencia; − = menor. */
  deviation?: number
}

/** Largos de segmentos anatómicos en unidades-cabeza (Loomis/Bridgman). Son los
 *  coeficientes CANÓNICOS: inmutables, no se ajustan a la anatomía. */
const LENGTH_HEADS: Record<string, number> = {
  upperArm: 1.4,
  forearm: 1.15,
  hand: 0.9,
  thigh: 2,
  shin: 1.7,
  foot: 1,
}

/** Orden de presentación de los largos. */
const LENGTH_ORDER = ['upperArm', 'forearm', 'hand', 'thigh', 'shin', 'foot'] as const

/**
 * Referencia anatómica (Capa de análisis): rangos observados en atlas/antropometría,
 * en unidades-cabeza. INDEPENDIENTE del canon — sirve para medir la desviación, no
 * para corregir los coeficientes canónicos. Misma clave que cada `Measurement`.
 */
export const ANATOMY_REFERENCE: Record<string, AnatomyRef> = {
  shouldersW: { min: 1.9, max: 2.1 },
  waistW: { min: 1.1, max: 1.5 },
  pelvisW: { min: 1.5, max: 1.7 },
  limb: { min: 0.3, max: 0.4 },
  upperArm: { min: 1.45, max: 1.55 },
  forearm: { min: 1.1, max: 1.2 },
  hand: { min: 0.85, max: 0.95 },
  thigh: { min: 1.9, max: 2.1 },
  shin: { min: 1.5, max: 1.6 },
  foot: { min: 0.95, max: 1.05 },
}

/** ¿El valor canónico cae dentro del rango anatómico? */
export function withinRef(heads: number, ref: AnatomyRef): boolean {
  return heads >= ref.min && heads <= ref.max
}

function withRef(key: string, heads: number, cm: number, group: MeasureGroup): Measurement {
  const ref = ANATOMY_REFERENCE[key]
  if (!ref) return { key, heads, cm, group }
  return { key, heads, cm, group, ref, deviation: heads - (ref.min + ref.max) / 2 }
}

export function buildMeasurements(model: FigureModel): Measurement[] {
  const h = model.headCm
  const out: Measurement[] = [
    { key: 'height', heads: model.headCount, cm: model.heightCm, group: 'unit' },
    { key: 'headUnit', heads: 1, cm: h, group: 'unit' },
    // Anchos (del canon): cm / cabeza = el valor en cabezas original.
    withRef('shouldersW', model.widthsCm.shoulders / h, model.widthsCm.shoulders, 'width'),
    withRef('waistW', model.widthsCm.waist / h, model.widthsCm.waist, 'width'),
    withRef('pelvisW', model.widthsCm.pelvis / h, model.widthsCm.pelvis, 'width'),
    withRef('limb', model.widthsCm.limb / h, model.widthsCm.limb, 'width'),
  ]
  for (const key of LENGTH_ORDER) {
    const heads = LENGTH_HEADS[key]
    out.push(withRef(key, heads, heads * h, 'length'))
  }
  return out
}
