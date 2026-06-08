// Láminas overlay anatómicas (esqueleto / musculatura) por canon y vista.
// Son PNG extra que se dibujan ALINEADAS sobre la figura limpia (mismo recorte
// coronilla→planta y mismo aspecto que `frontal/lateral/posterior.png`), así el
// overlay calza pixel a pixel con la lámina base.
//
// Assets: `public/canon/<canonId>/overlays/<layer>-<view>.png`.
// Agregar un overlay = poner el PNG + listar su vista aquí. Mientras no haya,
// el toggle no aparece en la barra (capa "vacía" oculta).

import { type View } from './figureMeta'

export type OverlayLayer = 'skeleton' | 'muscles'

/** Qué vistas tienen lámina por canon y capa. VACÍO hasta agregar assets. */
const OVERLAY_ASSETS: Record<string, Partial<Record<OverlayLayer, View[]>>> = {
  // Ejemplo (cuando exista el PNG):
  // heroic: { skeleton: ['frontal', 'lateral'], muscles: ['frontal'] },
}

/** ¿Hay lámina de ese overlay para el canon+vista exacto? */
export function hasOverlay(canonId: string, layer: OverlayLayer, view: View): boolean {
  return OVERLAY_ASSETS[canonId]?.[layer]?.includes(view) ?? false
}

/** ¿El canon tiene ALGUNA vista de ese overlay? (para mostrar el toggle). */
export function canonHasOverlay(canonId: string, layer: OverlayLayer): boolean {
  return (OVERLAY_ASSETS[canonId]?.[layer]?.length ?? 0) > 0
}

/** Ruta del overlay, o `null` si no hay asset para ese canon+capa+vista. */
export function overlaySrc(canonId: string, layer: OverlayLayer, view: View): string | null {
  if (!hasOverlay(canonId, layer, view)) return null
  return `/canon/${canonId}/overlays/${layer}-${view}.png`
}
