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

/** Largos de segmentos anatómicos en unidades-cabeza (Loomis/Bridgman/Richer).
 *  Coeficientes CANÓNICOS: inmutables, no se ajustan a la anatomía. Los
 *  compuestos (armFull/legFull) son sumas de sus segmentos. */
const LENGTH_HEADS: Record<string, number> = {
  neckLen: 0.33, // base del cráneo → hombros (Richer)
  upperArm: 1.4, // acromion → epicóndilo (hombro a codo)
  forearm: 1.15, // codo → muñeca
  hand: 0.9, // muñeca → punta del dedo medio (≈ largo de la cara)
  armFull: 3.45, // brazo completo hombro → punta de dedos (1.4+1.15+0.9)
  trunk: 3, // mentón → pubis (tronco), ≈ 3 cabezas (Loomis)
  thigh: 2, // cresta púbica → rótula (Loomis)
  shin: 1.7, // rótula → planta
  legFull: 3.7, // pierna completa (2+1.7)
  foot: 1, // largo del pie ≈ 1 cabeza (Richer)
}

/** Orden de presentación de los largos (cabeza→pies, segmento y luego total). */
const LENGTH_ORDER = ['neckLen', 'trunk', 'upperArm', 'forearm', 'hand', 'armFull', 'thigh', 'shin', 'legFull', 'foot'] as const

/** Anchos TRANSVERSOS (izq-der) de referencia FIJOS (no dependen del canon):
 *  cabeza, cuello y tórax, en unidades-cabeza (antropometría / Loomis). Los de
 *  hombros/cintura/pelvis/extremidad vienen del canon (ver `buildMeasurements`).
 *  Se muestran en vista FRONTAL y POSTERIOR. */
const WIDTH_FIXED: Record<string, number> = {
  headW: 0.66, // cabeza ≈ 2/3 de su altura de ancho
  neckW: 0.5, // cuello ≈ media cabeza de ancho
  chestW: 1.5, // tórax ≈ 1.5 cabezas
  scapulaW: 1.5, // amplitud biscapular (entre bordes externos de las escápulas)
  interScapW: 0.5, // separación entre los bordes internos de las escápulas
}

/** Orden de presentación de los anchos en FRONTAL (de la cabeza hacia abajo). */
const WIDTH_ORDER = ['headW', 'neckW', 'shouldersW', 'chestW', 'waistW', 'pelvisW', 'limb'] as const

/** Orden en POSTERIOR: añade medidas propias de la espalda (escápulas) que no
 *  se leen de frente. El resto de anchos transversos coincide con frontal. */
const POSTERIOR_WIDTH_ORDER = ['headW', 'neckW', 'shouldersW', 'scapulaW', 'interScapW', 'chestW', 'waistW', 'pelvisW', 'limb'] as const

/** PROFUNDIDADES sagitales (frente-espalda) en unidades-cabeza (antropometría).
 *  Son las medidas que se leen en vista LATERAL — distintas de los anchos. El
 *  cuerpo es más profundo que ancho en cabeza/tórax/pelvis y más fino en cintura. */
const DEPTH_FIXED: Record<string, number> = {
  headD: 0.8, // cráneo más largo (frente-occipucio) que ancho
  neckD: 0.55,
  chestD: 0.95, // tórax: caja profunda
  waistD: 0.7,
  pelvisD: 0.95, // glúteo-abdomen
  limb: 0.36, // grosor de extremidad (igual en todas las vistas)
}

/** Orden de presentación de las profundidades (vista lateral). */
const DEPTH_ORDER = ['headD', 'neckD', 'chestD', 'waistD', 'pelvisD', 'limb'] as const

/**
 * Referencia anatómica (Capa de análisis): rangos observados en atlas/antropometría,
 * en unidades-cabeza. INDEPENDIENTE del canon — sirve para medir la desviación, no
 * para corregir los coeficientes canónicos. Misma clave que cada `Measurement`.
 */
export const ANATOMY_REFERENCE: Record<string, AnatomyRef> = {
  // Anchos
  headW: { min: 0.6, max: 0.72 },
  neckW: { min: 0.4, max: 0.6 },
  shouldersW: { min: 1.9, max: 2.1 },
  chestW: { min: 1.4, max: 1.7 },
  scapulaW: { min: 1.4, max: 1.6 },
  interScapW: { min: 0.4, max: 0.6 },
  waistW: { min: 1.1, max: 1.5 },
  pelvisW: { min: 1.5, max: 1.7 },
  limb: { min: 0.3, max: 0.4 },
  // Largos
  neckLen: { min: 0.25, max: 0.4 },
  upperArm: { min: 1.45, max: 1.55 },
  forearm: { min: 1.1, max: 1.2 },
  hand: { min: 0.85, max: 0.95 },
  armFull: { min: 3.4, max: 3.6 },
  trunk: { min: 2.9, max: 3.1 },
  thigh: { min: 1.9, max: 2.1 },
  shin: { min: 1.5, max: 1.6 },
  legFull: { min: 3.5, max: 3.8 },
  foot: { min: 0.95, max: 1.05 },
  // Profundidades (vista lateral)
  headD: { min: 0.72, max: 0.88 },
  neckD: { min: 0.45, max: 0.65 },
  chestD: { min: 0.85, max: 1.05 },
  waistD: { min: 0.6, max: 0.8 },
  pelvisD: { min: 0.85, max: 1.05 },
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

/** Vista de la figura; gobierna qué medidas transversales se leen. */
export type MeasureView = 'frontal' | 'lateral' | 'posterior'

/**
 * Construye las medidas para un canon + altura + VISTA. Los LARGOS (verticales)
 * son iguales en toda vista. Las medidas transversales cambian: frontal/posterior
 * leen ANCHOS (izq-der); lateral lee PROFUNDIDADES (frente-espalda), que son
 * medidas distintas y menores/mayores según la parte.
 */
export function buildMeasurements(model: FigureModel, view: MeasureView = 'frontal'): Measurement[] {
  const h = model.headCm
  const out: Measurement[] = [
    { key: 'height', heads: model.headCount, cm: model.heightCm, group: 'unit' },
    { key: 'headUnit', heads: 1, cm: h, group: 'unit' },
  ]
  if (view === 'lateral') {
    // Profundidades sagitales (frente-espalda). El grosor de extremidad es igual.
    for (const key of DEPTH_ORDER) {
      const heads = DEPTH_FIXED[key]
      out.push(withRef(key, heads, heads * h, 'width'))
    }
  } else {
    // Anchos transversos: cabeza/cuello/tórax fijos + hombros/cintura/pelvis/
    // extremidad del canon (cm / cabeza = valor en cabezas). Posterior añade
    // las medidas de las escápulas (solo visibles de espaldas).
    const canonW: Record<string, number> = {
      shouldersW: model.widthsCm.shoulders / h,
      waistW: model.widthsCm.waist / h,
      pelvisW: model.widthsCm.pelvis / h,
      limb: model.widthsCm.limb / h,
    }
    const order = view === 'posterior' ? POSTERIOR_WIDTH_ORDER : WIDTH_ORDER
    for (const key of order) {
      const heads = canonW[key] ?? WIDTH_FIXED[key]
      out.push(withRef(key, heads, heads * h, 'width'))
    }
  }
  // Largos: coeficientes canónicos por segmento (+ totales). Iguales en toda vista.
  for (const key of LENGTH_ORDER) {
    const heads = LENGTH_HEADS[key]
    out.push(withRef(key, heads, heads * h, 'length'))
  }
  return out
}
