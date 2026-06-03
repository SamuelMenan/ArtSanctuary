// Geometría pura de la guía reglamentaria Carnaval (Fase 6). Produce
// rectángulos/líneas en CM de boceto para CUALQUIER vista (frontal, posterior,
// lateral, superior), anclados con la base en el origen (0,0) y la obra
// creciendo hacia arriba (y negativo, convención Konva y-abajo).
// La capa visual (CarnavalGuideLayer) convierte cm→px con PX_PER_CM.

import type { CarnavalRule } from '@shared/lib/workspaces/carnaval'
import { VIEW_AXES, baseAlong, type CarnavalView } from '@shared/lib/workspaces/carnaval'

export type GuideRect = {
  kind: 'max' | 'min' | 'base'
  x: number
  y: number
  w: number
  h: number
}

export type GuideLine = {
  kind: 'human'
  x: number
  y: number
  w: number
  label: string
}

export type CarnavalGuide = {
  rects: GuideRect[]
  lines: GuideLine[]
  /** Envolvente total en cm (para encuadre/zoom). */
  bounds: { x: number; y: number; w: number; h: number }
}

/**
 * Construye la guía de una vista: envolvente máxima (width×height según la
 * vista), mínima reglamentaria, huella de base y —solo si la vertical es el
 * alto— la figura humana de referencia.
 * Anclaje: base apoyada en y=0; la obra ocupa y negativo (hacia arriba).
 */
export function buildCarnavalGuide(
  rule: CarnavalRule,
  view: CarnavalView = 'frontal',
): CarnavalGuide {
  const { width: wAxis, height: hAxis } = VIEW_AXES[view]

  const wMax = rule.dims[wAxis]?.max ?? rule.dims[wAxis]?.min ?? baseAlong(rule.base, wAxis)
  const hMax = rule.dims[hAxis]?.max ?? rule.dims[hAxis]?.min ?? 0
  const wMin = rule.dims[wAxis]?.min
  const hMin = rule.dims[hAxis]?.min

  const rects: GuideRect[] = []
  const lines: GuideLine[] = []

  // Envolvente máxima: centrada en x, apoyada en la base (y de -hMax a 0).
  const maxX = -wMax / 2
  if (hMax > 0) {
    rects.push({ kind: 'max', x: maxX, y: -hMax, w: wMax, h: hMax })
  }

  // Envolvente mínima (debe alcanzarse al menos): centrada, apoyada en base.
  if (wMin != null && hMin != null) {
    rects.push({ kind: 'min', x: -wMin / 2, y: -hMin, w: wMin, h: hMin })
  }

  // Huella de base obligatoria a lo largo del eje horizontal de la vista.
  const baseW = baseAlong(rule.base, wAxis)
  const baseH = baseAlong(rule.base, hAxis)
  rects.push({ kind: 'base', x: -baseW / 2, y: 0, w: baseW, h: baseH })

  // Figura humana: solo en vistas cuya vertical es el alto (no en superior).
  if (hAxis === 'alto' && rule.humanRefCm != null) {
    lines.push({
      kind: 'human',
      x: maxX,
      y: -rule.humanRefCm,
      w: wMax,
      label: `${rule.humanRefCm} cm (hombros)`,
    })
  }

  const top = -Math.max(hMax, hAxis === 'alto' ? rule.humanRefCm ?? 0 : 0)
  const bottom = baseH
  const width = Math.max(wMax, baseW)

  return {
    rects,
    lines,
    bounds: { x: -width / 2, y: top, w: width, h: bottom - top },
  }
}

/**
 * Huella de la base vista desde arriba (ancho×largo), centrada en el origen.
 * Referencia para planos especiales (bastidores/jugadores), que se organizan
 * sobre la base sin validación dimensional.
 */
export function buildBaseFootprint(rule: CarnavalRule): GuideRect {
  return {
    kind: 'base',
    x: -rule.base.ancho / 2,
    y: -rule.base.largo / 2,
    w: rule.base.ancho,
    h: rule.base.largo,
  }
}
