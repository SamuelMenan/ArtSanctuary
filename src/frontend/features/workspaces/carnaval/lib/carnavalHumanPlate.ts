// Figura humana reglamentaria del board de Carnaval.
//
// Es la lámina de Canon (heroico, 8 cabezas) en la perspectiva del plano
// activo, escalada para que el tramo planta→hombros mida la referencia oficial
// (15 cm). Sustituye a la silueta SVG dibujada por código que había antes:
// aquella era el maniquí procedural de 7.5 cabezas y solo tenía vista frontal.
//
// Las 3 vistas de Canon (frontal/lateral/posterior) existen precisamente para
// calzar con los planos geométricos de Carnaval.

import { getLandmarks } from '@shared/lib/canon/landmarks'
import { figureDims, figureSrc, type View as CanonView } from '@shared/lib/canon/plates'
import { isGeometricView, type CarnavalPlano, type CarnavalView } from '@shared/lib/workspaces/carnaval'

/** Canon de referencia de la suite: heroico (8 cabezas). */
export const CARNAVAL_CANON_ID = 'heroic'

/**
 * Nombre EXACTO del objeto de figura humana dentro del board.
 *
 * ⚠️ `carnavalInspect.objectsBBoxPx` lo usa para excluir la figura de la
 * envolvente medida: es referencia, no obra. Cambiar este literal (o el nombre
 * de la capa desde la UI) hace que el Inspector empiece a medir la figura como
 * si fuera parte del boceto, sin ningún error visible.
 */
export const HUMAN_FIGURE_NAME = 'Figura humana'

/** Fallback si el canon no tuviera medida de hombros (heroico sí la tiene). */
const DEFAULT_SHOULDER_FRAC = 0.16

/**
 * Plano de Carnaval → lámina de Canon. La lámina lateral es un perfil que mira
 * a la derecha: va tal cual en el lateral derecho y espejada en el izquierdo,
 * el mismo origen que usa el espejo automático entre planos laterales.
 * La vista superior no aparece: la lámina es un alzado y en planta no significa
 * nada (el botón ya está oculto ahí).
 */
const PLATE_BY_VIEW: Record<CarnavalView, { view: CanonView; flipX: boolean } | null> = {
  frontal: { view: 'frontal', flipX: false },
  posterior: { view: 'posterior', flipX: false },
  lateralDer: { view: 'lateral', flipX: false },
  lateralIzq: { view: 'lateral', flipX: true },
  superior: null,
}

/**
 * Posición de la línea de hombros como fracción de la altura total de la lámina
 * (0 = coronilla). Se lee de los landmarks de Canon —medidos sobre el dibujo—
 * para que remedir la lámina actualice también la figura de Carnaval.
 */
export function shoulderFrac(canonId: string = CARNAVAL_CANON_ID): number {
  return getLandmarks(canonId).find((l) => l.key === 'hombros')?.frac ?? DEFAULT_SHOULDER_FRAC
}

export type HumanPlate = {
  /** Ruta de la lámina (`/canon/heroic/<vista>.png`). */
  src: string
  /** Tamaño en cm de BOCETO de la lámina completa (coronilla→planta). */
  wCm: number
  hCm: number
  /** La lámina se inserta espejada horizontalmente. */
  flipX: boolean
}

/**
 * Lámina de figura humana para un plano, dimensionada en cm de boceto para que
 * planta→hombros mida `shouldersCm`. `null` si el plano no admite figura
 * (vista superior o plano especial).
 *
 * La lámina es a sangre (coronilla arriba, planta abajo), así que la altura
 * total sale de la fracción de hombros: si los hombros están al 16% desde la
 * coronilla, el tramo planta→hombros es el 84% restante.
 */
export function humanPlateFor(
  plano: CarnavalPlano,
  shouldersCm: number,
  canonId: string = CARNAVAL_CANON_ID,
): HumanPlate | null {
  if (!isGeometricView(plano)) return null
  const plate = PLATE_BY_VIEW[plano]
  if (!plate) return null

  const hCm = shouldersCm / (1 - shoulderFrac(canonId))
  const { w, h } = figureDims(canonId, plate.view)
  return { src: figureSrc(canonId, plate.view), wCm: (w / h) * hCm, hCm, flipX: plate.flipX }
}
