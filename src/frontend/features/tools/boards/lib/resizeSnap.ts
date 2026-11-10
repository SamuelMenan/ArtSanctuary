// Imán del redimensionado. Lógica PURA, en coordenadas de MUNDO: el
// `boundBoxFunc` del Stage solo convierte pantalla↔mundo y delega aquí.
//
// El problema que resuelve: el imán trabaja por BORDES, pero los modificadores
// imponen una FORMA a la caja (simétrica respecto al centro, o de proporción
// fija). Imantar cada borde por su cuenta deshace esa forma —que es justo lo
// que Konva acababa de calcular:
//   · centrado  → al crecer desde el centro se mueven los DOS bordes opuestos;
//                 si cada uno cae en una línea distinta, la caja deja de ser
//                 simétrica y el objeto deriva mientras arrastras.
//   · proporción→ imantar el ancho sin tocar el alto rompe la razón.
// Por eso aquí se imanta SOLO el borde que el usuario arrastra y todo lo demás
// se deriva de él.

import type { ResizeModifiers } from '../hooks/useResizeModifiers'

/** Caja en coordenadas de mundo, por bordes (más cómodo que x/y/w/h aquí). */
export type Rect = { left: number; right: number; top: number; bottom: number }

/** Extremo de un eje que se está arrastrando: `lo` = izq/arriba, `hi` = der/abajo. */
type Side = 'lo' | 'hi' | null

export type SnapResizeOpts = {
  /** Ancla activa de Konva (`top-left`, `middle-right`, …). `null` = deducir. */
  anchor: string | null
  mode: ResizeModifiers
  /** Imán del eje X (líneas verticales) y del eje Y (horizontales). */
  snapX: (v: number) => number
  snapY: (v: number) => number
  /** Tamaño mínimo en cada eje (candado anti-NaN: nunca 0 ni negativo). */
  min: number
}

/** Tolerancia para dar un borde por movido, en px de mundo. */
const EPS = 0.01

/**
 * Qué extremo de cada eje está arrastrando el usuario. Con el ancla activa es
 * exacto; sin ella se deduce por qué borde se movió, que es lo que servía antes
 * de tener `getActiveAnchor()` y sigue valiendo de red de seguridad.
 */
export function draggedSides(anchor: string | null, old: Rect, next: Rect): { x: Side; y: Side } {
  if (anchor) {
    return {
      x: anchor.includes('left') ? 'lo' : anchor.includes('right') ? 'hi' : null,
      y: anchor.includes('top') ? 'lo' : anchor.includes('bottom') ? 'hi' : null,
    }
  }
  return {
    x: Math.abs(next.left - old.left) > EPS ? 'lo' : Math.abs(next.right - old.right) > EPS ? 'hi' : null,
    y: Math.abs(next.top - old.top) > EPS ? 'lo' : Math.abs(next.bottom - old.bottom) > EPS ? 'hi' : null,
  }
}

/**
 * Aplica el imán a la caja que propone Konva, respetando el modificador activo.
 * `old` es la caja al empezar el movimiento y `next` la propuesta; ambas en
 * coordenadas de mundo y sin rotación (el llamador ya descarta cajas rotadas).
 */
export function snapResizeRect(old: Rect, next: Rect, opts: SnapResizeOpts): Rect {
  const { anchor, mode, snapX, snapY, min } = opts
  const drag = draggedSides(anchor, old, next)

  const cx = (old.left + old.right) / 2
  const cy = (old.top + old.bottom) / 2

  const out: Rect = { ...next }

  // 1) Imantar ÚNICAMENTE el borde que se arrastra. El opuesto lo fija el modo.
  if (drag.x === 'lo') out.left = snapX(out.left)
  if (drag.x === 'hi') out.right = snapX(out.right)
  if (drag.y === 'lo') out.top = snapY(out.top)
  if (drag.y === 'hi') out.bottom = snapY(out.bottom)

  // Fija un tamaño respetando quién manda: el centro si está centrado, y si no
  // el borde opuesto al que se arrastra (que debe quedarse quieto).
  const setWidth = (w: number) => {
    if (mode.centered) {
      out.left = cx - w / 2
      out.right = cx + w / 2
    } else if (drag.x === 'lo') {
      out.left = out.right - w
    } else {
      out.right = out.left + w
    }
  }
  const setHeight = (h: number) => {
    if (mode.centered) {
      out.top = cy - h / 2
      out.bottom = cy + h / 2
    } else if (drag.y === 'lo') {
      out.top = out.bottom - h
    } else {
      out.bottom = out.top + h
    }
  }

  // 2) Centrado: el centro de la caja vieja es intocable → el borde opuesto es
  //    el espejo del que se arrastra. Así la simetría sobrevive al imán.
  if (mode.centered) {
    if (drag.x === 'lo') out.right = 2 * cx - out.left
    else if (drag.x === 'hi') out.left = 2 * cx - out.right
    if (drag.y === 'lo') out.bottom = 2 * cy - out.top
    else if (drag.y === 'hi') out.top = 2 * cy - out.bottom
  }

  // 3) Proporción: solo en esquinas, igual que el `keepRatio` de Konva (las
  //    anclas medias mueven un único eje y no tienen razón que conservar).
  //    Manda el eje que más ha cambiado en términos relativos; el otro se deriva.
  if (mode.keepRatio && drag.x && drag.y) {
    const ow = old.right - old.left
    const oh = old.bottom - old.top
    if (ow > 0 && oh > 0) {
      const w = out.right - out.left
      const h = out.bottom - out.top
      if (Math.abs(w / ow - 1) >= Math.abs(h / oh - 1)) setHeight((w * oh) / ow)
      else setWidth((h * ow) / oh)
    }
  }

  // 4) Tamaño mínimo, por el mismo camino (no rompe centrado ni ancla).
  if (out.right - out.left < min) setWidth(min)
  if (out.bottom - out.top < min) setHeight(min)

  return out
}
