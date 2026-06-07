// Generador paramétrico de la figura humana: dado un canon + altura, produce el
// MODELO (unidad base + medidas en cm). Es la fuente única que la UI (chart,
// panel de medidas, export) consume. Puro y O(1) → memoizable sin coste.
//
// Nota: la geometría vertical del cuerpo ya NO se deriva por segmentos (la figura
// es una lámina PNG con posiciones medidas en `landmarks.ts`). `canons.ts` sigue
// definiendo `segments` solo como dato/validación de `headCount`.

import { getCanon, type Canon } from './canons'

export interface FigureModel {
  canonId: string
  /** Total de cabezas del canon. */
  headCount: number
  /** Altura total en cm. */
  heightCm: number
  /** Altura de una cabeza en cm (unidad base). */
  headCm: number
  /** Anchos característicos en cm (derivados de los anchos del canon · cabeza). */
  widthsCm: { shoulders: number; waist: number; pelvis: number; limb: number }
}

export interface BuildFigureParams {
  /** Id del canon; por defecto el académico (7.5). */
  canonId?: string
  /** Altura total en cm. */
  heightCm: number
}

/** Construye el modelo de la figura: unidad-cabeza + anchos en cm reales. */
export function buildFigure({ canonId, heightCm }: BuildFigureParams): FigureModel {
  const canon: Canon = getCanon(canonId)
  const headCm = heightCm / canon.headCount

  return {
    canonId: canon.id,
    headCount: canon.headCount,
    heightCm,
    headCm,
    widthsCm: {
      shoulders: canon.widths.shoulders * headCm,
      waist: canon.widths.waist * headCm,
      pelvis: canon.widths.pelvis * headCm,
      limb: canon.widths.limb * headCm,
    },
  }
}
