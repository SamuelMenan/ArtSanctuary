// Utilidades de inspección reglamentaria (Fase 6/7). Puente entre los objetos
// del lienzo y el motor de validación: mide la envolvente del diseño y la
// proyecta a los ejes de la vista activa. Lógica pura, sin React.

import { cmOf } from '@shared/lib/measure'
import type { BoardObject } from '@shared/lib/boards/types'
import {
  type AxisResult,
  type BocetoMeasures,
  type CarnavalView,
  VIEW_AXES,
} from '@shared/lib/workspaces/carnaval'

/** Envolvente (px de mundo) de los objetos que cuentan como obra. Excluye
 *  anotaciones (texto/stickies) y la figura humana de referencia, que no son
 *  parte de la obra a medir. `null` si no hay objetos que medir. */
export function objectsBBoxPx(objects: BoardObject[]): { x: number; y: number; w: number; h: number } | null {
  const visible = objects.filter(
    (o) =>
      o.visible !== false &&
      o.type !== 'text' &&
      o.type !== 'sticky' &&
      o.name !== 'Figura humana',
  )
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
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}

/** Envolvente (ancho×alto del lienzo) de los objetos visibles, en cm de boceto. */
export function objectsBBoxCm(objects: BoardObject[]): { w: number; h: number } | null {
  const px = objectsBBoxPx(objects)
  if (!px) return null
  return { w: cmOf(px.w), h: cmOf(px.h) }
}

// ── Formato dual boceto↔obra real ───────────────────────────────────────────
// El usuario dibuja en cm de BOCETO pero piensa en cm de OBRA. Mostrar ambas
// escalas evita el "cumplo las medidas pero marca error": el límite reglamentario
// (boceto) parece pequeño hasta que se ve su equivalente real.

const round1 = (n: number) => Math.round(n * 10) / 10

/** Formatea una medida real (cm) añadiendo metros cuando ≥ 100 cm. */
export function fmtReal(realCm: number): string {
  const cm = round1(realCm)
  if (cm < 100) return `${cm} cm`
  return `${cm} cm (${round1(cm / 100)} m)`
}

/** `60 cm boceto · 9 m real` para un valor de boceto y su escala obra:boceto. */
export function fmtDual(bocetoCm: number, scale: number): string {
  return `${round1(bocetoCm)} cm boceto · ${fmtReal(bocetoCm * scale)} real`
}

/** Mensaje de un eje con AMBAS escalas (boceto + obra real) para el Inspector. */
export function axisDualMessage(r: AxisResult, scale: number): string {
  const val = fmtDual(r.valueCm, scale)
  const range = r.range
  switch (r.status) {
    case 'over':
      return `${r.axis}: ${val} — supera máx ${fmtDual(range?.max ?? 0, scale)}`
    case 'under':
      return `${r.axis}: ${val} — bajo mín ${fmtDual(range?.min ?? 0, scale)}`
    case 'mismatch':
      return `${r.axis}: ${val} — debe ser exacto ${fmtDual(range?.exact ?? 0, scale)}`
    case 'warn':
      return `${r.axis}: ${val} — cerca del límite`
    case 'na':
      return `${r.axis}: sin restricción`
    default:
      return `${r.axis}: ${val} ✓`
  }
}

/** Proyecta una envolvente (w×h del lienzo) a los ejes reglamentarios de la vista. */
export function bboxToMeasures(view: CarnavalView, bbox: { w: number; h: number }): BocetoMeasures {
  const { width: wAxis, height: hAxis } = VIEW_AXES[view]
  return { [wAxis]: bbox.w, [hAxis]: bbox.h }
}
