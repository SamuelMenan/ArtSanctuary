// Articulaciones como overlay de puntos sobre la figura limpia.
//
// A diferencia de los landmarks (solo altura `frac`), una articulación necesita
// también su posición HORIZONTAL `x` (0 = borde izq de la caja de la figura,
// 1 = borde der), porque hombros/codos/muñecas/rodillas/tobillos están a los
// lados, no en el eje. Esa `x` se MIDE por dibujo (varía con la pose y la vista),
// así que los joints van por canon y por vista. VACÍO hasta medir cada lámina.

import { type View } from './figureMeta'

export interface Joint {
  /** Clave i18n `canon.joints.<key>`. */
  key: string
  /** Posición horizontal en la caja de la figura (0..1). */
  x: number
  /** Altura como fracción de la altura total (0..1). */
  frac: number
}

/** Joints medidos por canon y vista. VACÍO hasta tener las posiciones x.
 *  Ejemplo: heroic: { frontal: [{ key:'hombroDer', x:0.30, frac:0.165 }, ...] }. */
const CANON_JOINTS: Record<string, Partial<Record<View, Joint[]>>> = {}

/** Joints de un canon+vista (vacío si no hay medición). */
export function getJoints(canonId: string, view: View): Joint[] {
  return CANON_JOINTS[canonId]?.[view] ?? []
}

/** ¿El canon+vista tiene joints medidos? (para mostrar el toggle). */
export function hasJoints(canonId: string, view: View): boolean {
  return getJoints(canonId, view).length > 0
}
