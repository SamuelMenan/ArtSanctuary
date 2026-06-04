// Geometría pura de la guía reglamentaria Carnaval (Fase 6). Produce
// rectángulos/líneas en CM de boceto para CUALQUIER vista (frontal, posterior,
// lateral, superior), anclados con la base en el origen (0,0) y la obra
// creciendo hacia arriba (y negativo, convención Konva y-abajo).
// La capa visual (CarnavalGuideLayer) convierte cm→px con PX_PER_CM.

import type { CarnavalRule } from '@shared/lib/workspaces/carnaval'
import { VIEW_AXES, baseAlong, isPlanView, type CarnavalView } from '@shared/lib/workspaces/carnaval'

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
  // En planta (superior) la vista es desde arriba: las zonas se dibujan
  // concéntricas (centradas en el origen). En alzado (frontal/lateral) la base
  // se apoya en y=0 y la obra crece hacia arriba (y negativo).
  const plan = isPlanView(view)

  const wMax = rule.dims[wAxis]?.max ?? rule.dims[wAxis]?.min ?? baseAlong(rule.base, wAxis)
  const hMax = rule.dims[hAxis]?.max ?? rule.dims[hAxis]?.min ?? 0
  const wMin = rule.dims[wAxis]?.min
  const hMin = rule.dims[hAxis]?.min

  const rects: GuideRect[] = []
  const lines: GuideLine[] = []

  // y del borde superior de una envolvente de alto h: centrada en planta,
  // apoyada en la base (de -h a 0) en alzado.
  const yTop = (h: number) => (plan ? -h / 2 : -h)

  // Envolvente máxima: centrada en x.
  const maxX = -wMax / 2
  if (hMax > 0) {
    rects.push({ kind: 'max', x: maxX, y: yTop(hMax), w: wMax, h: hMax })
  }

  // Envolvente mínima (debe alcanzarse al menos): centrada en x.
  if (wMin != null && hMin != null) {
    rects.push({ kind: 'min', x: -wMin / 2, y: yTop(hMin), w: wMin, h: hMin })
  }

  // Huella de base obligatoria. En planta es concéntrica; en alzado apoyada en y=0.
  const baseW = baseAlong(rule.base, wAxis)
  const baseH = baseAlong(rule.base, hAxis)
  rects.push({ kind: 'base', x: -baseW / 2, y: plan ? -baseH / 2 : 0, w: baseW, h: baseH })

  // Figura humana: solo en vistas de alzado cuya vertical es el alto (no en superior).
  if (hAxis === 'alto' && rule.humanRefCm != null) {
    lines.push({
      kind: 'human',
      x: maxX,
      y: -rule.humanRefCm,
      w: wMax,
      label: `${rule.humanRefCm} cm (hombros)`,
    })
  }

  const width = Math.max(wMax, baseW)

  if (plan) {
    // Envolvente total centrada en el origen (cuadro visto desde arriba).
    const height = Math.max(hMax, baseH)
    return {
      rects,
      lines,
      bounds: { x: -width / 2, y: -height / 2, w: width, h: height },
    }
  }

  const top = -Math.max(hMax, hAxis === 'alto' ? rule.humanRefCm ?? 0 : 0)
  const bottom = baseH

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
