import type { RefObject, Dispatch, SetStateAction } from 'react'
import type Konva from 'konva'

type Vec = { x: number; y: number }

// Límites de zoom (estilo Figma: amplio margen para acercar al detalle).
export const MIN_SCALE = 0.02
export const MAX_SCALE = 40
export const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s))

/**
 * Zoom del lienzo: rueda (centrado en el cursor) y botones (centrado en el
 * escenario), con reset de vista. El paneo por arrastre vive en los handlers
 * de puntero del editor (comparten dispatch con regla y selección).
 */
export function usePanZoom(
  scale: number,
  pos: Vec,
  stageSize: { w: number; h: number },
  stageRef: RefObject<Konva.Stage | null>,
  setScale: Dispatch<SetStateAction<number>>,
  setPos: Dispatch<SetStateAction<Vec>>,
) {
  const onWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return

    // La rueda sola hace ZOOM (no baja la pantalla, que estorbaba al mover el
    // lienzo). El paneo se hace con modificadores: Shift = horizontal,
    // Alt = vertical. (Mover el lienzo también con espacio o botón central.)
    if (e.evt.shiftKey || e.evt.altKey) {
      const delta = e.evt.deltaY || e.evt.deltaX
      if (e.evt.shiftKey) setPos((p) => ({ x: p.x - delta, y: p.y }))
      else setPos((p) => ({ x: p.x, y: p.y - delta }))
      return
    }

    const oldScale = scale
    const pointer = stage.getPointerPosition()
    if (!pointer) return
    const mousePoint = {
      x: (pointer.x - pos.x) / oldScale,
      y: (pointer.y - pos.y) / oldScale,
    }
    const next = clampScale(oldScale * (e.evt.deltaY < 0 ? 1.08 : 1 / 1.08))
    setScale(next)
    setPos({
      x: pointer.x - mousePoint.x * next,
      y: pointer.y - mousePoint.y * next,
    })
  }

  const resetView = () => {
    setPos({ x: 0, y: 0 })
    setScale(1)
  }

  // Zoom centrado en el escenario (botones de la isla de vista).
  const zoomBy = (factor: number) => {
    const next = clampScale(scale * factor)
    const cx = stageSize.w / 2
    const cy = stageSize.h / 2
    const wx = (cx - pos.x) / scale
    const wy = (cy - pos.y) / scale
    setScale(next)
    setPos({ x: cx - wx * next, y: cy - wy * next })
  }

  return { onWheel, resetView, zoomBy }
}
