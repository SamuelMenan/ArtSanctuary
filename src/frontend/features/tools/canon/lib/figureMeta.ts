// Metadatos de las láminas de Canon (rutas, dims intrínsecas, fallback).
// Separado de `ReferenceFigure.tsx` para que ese archivo solo exporte el
// componente (Fast Refresh / react-doctor only-export-components).

/** Vistas de la figura limpia (`public/canon/<canonId>/<view>.png`). */
export type View = 'frontal' | 'lateral' | 'posterior'

export const VIEWS: View[] = ['frontal', 'lateral', 'posterior']

export interface Meta {
  w: number
  h: number
}

// Tamaño intrínseco real de cada lámina (px), por canon y vista. next/image lo
// usa para el aspecto; se renderiza por ALTURA (w auto) para preservar la
// proporción. Añadir un canon = una entrada aquí + las 3 imágenes en
// `public/canon/<id>/`. Mientras un canon no tenga láminas, cae a heroico.
export const FIGURES: Record<string, Record<View, Meta>> = {
  academic: {
    frontal: { w: 425, h: 1354 },
    lateral: { w: 203, h: 1247 },
    posterior: { w: 424, h: 1312 },
  },
  heroic: {
    frontal: { w: 395, h: 1310 },
    lateral: { w: 216, h: 1312 },
    posterior: { w: 454, h: 1471 },
  },
  comic: {
    frontal: { w: 433, h: 1361 },
    lateral: { w: 211, h: 1255 },
    posterior: { w: 432, h: 1320 },
  },
}

/** Ids de canon que YA tienen las 3 láminas (para filtrar el selector). */
export const AVAILABLE_CANON_IDS: string[] = Object.keys(FIGURES)

/** Canon con láminas disponibles (cae a heroico mientras no haya más). */
export function resolveCanonId(canonId: string): string {
  return FIGURES[canonId] ? canonId : 'heroic'
}

/** Ruta de la lámina; comparte la misma resolución/fallback que el componente. */
export function figureSrc(canonId: string, view: View): string {
  return `/canon/${resolveCanonId(canonId)}/${view}.png`
}

/** Dims intrínsecas (px) de la lámina resuelta para canon+vista. */
export function figureDims(canonId: string, view: View): Meta {
  return FIGURES[resolveCanonId(canonId)][view]
}
