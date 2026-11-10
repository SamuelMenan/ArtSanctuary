// Metadatos de las láminas de Canon (rutas, dims intrínsecas, fallback).
//
// Vive en `shared` porque lo consumen DOS features: la herramienta Canon
// (`features/tools/canon`) y el board de Carnaval, que inserta la lámina como
// figura humana reglamentaria. `features/workspaces/* → shared` es dependencia
// legal; `features/workspaces/* → features/tools/*` NO lo es (ver
// `features/workspaces/README.md`). `tools/canon/lib/figureMeta.ts` lo
// re-exporta para no tocar a los consumidores de la herramienta.
//
// Las láminas son PNG transparentes y a sangre: la coronilla toca el borde
// superior y la planta el inferior. Por eso las fracciones de `landmarks.ts`
// (0 = coronilla, 1 = planta) mapean directo sobre la altura de la imagen.

/** Vistas de la figura limpia (`public/canon/<canonId>/<view>.png`). */
export type View = 'frontal' | 'lateral' | 'posterior'

export const VIEWS: View[] = ['frontal', 'lateral', 'posterior']

export interface Meta {
  w: number
  h: number
  /** Ruta de la lámina si NO es `/canon/<id>/<view>.png`. */
  src?: string
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
  const id = resolveCanonId(canonId)
  return FIGURES[id][view].src ?? `/canon/${id}/${view}.png`
}

/** Dims intrínsecas (px) de la lámina resuelta para canon+vista. */
export function figureDims(canonId: string, view: View): Meta {
  return FIGURES[resolveCanonId(canonId)][view]
}
