// Utilidades de inspección reglamentaria (Fase 6/7). Puente entre los objetos
// del lienzo y el motor de validación: mide la envolvente del diseño y la
// proyecta a los ejes de la vista activa. Lógica pura, sin React.

import { cmOf } from '@shared/lib/measure'
import type { BoardObject } from '@shared/lib/boards/types'
import {
  type BocetoMeasures,
  type CarnavalView,
  VIEW_AXES,
} from '@shared/lib/workspaces/carnaval'

/** Envolvente (ancho×alto del lienzo) de los objetos visibles, en cm de boceto. */
export function objectsBBoxCm(objects: BoardObject[]): { w: number; h: number } | null {
  const visible = objects.filter((o) => o.visible !== false)
  if (visible.length === 0) return null
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const o of visible) {
    minX = Math.min(minX, o.x)
    minY = Math.min(minY, o.y)
    maxX = Math.max(maxX, o.x + o.w)
    maxY = Math.max(maxY, o.y + o.h)
  }
  return { w: cmOf(maxX - minX), h: cmOf(maxY - minY) }
}

/** Proyecta una envolvente (w×h del lienzo) a los ejes reglamentarios de la vista. */
export function bboxToMeasures(view: CarnavalView, bbox: { w: number; h: number }): BocetoMeasures {
  const { width: wAxis, height: hAxis } = VIEW_AXES[view]
  return { [wAxis]: bbox.w, [hAxis]: bbox.h }
}
