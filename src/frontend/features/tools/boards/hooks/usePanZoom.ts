import type { RefObject, Dispatch, SetStateAction } from 'react'
import type Konva from 'konva'

type Vec = { x: number; y: number }

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
    const oldScale = scale
    const pointer = stage.getPointerPosition()
    if (!pointer) return
    const mousePoint = {
      x: (pointer.x - pos.x) / oldScale,
      y: (pointer.y - pos.y) / oldScale,
    }
    const next = Math.min(5, Math.max(0.02, oldScale * (e.evt.deltaY < 0 ? 1.08 : 1 / 1.08)))
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
    const next = Math.min(5, Math.max(0.02, scale * factor))
    const cx = stageSize.w / 2
    const cy = stageSize.h / 2
    const wx = (cx - pos.x) / scale
    const wy = (cy - pos.y) / scale
    setScale(next)
    setPos({ x: cx - wx * next, y: cy - wy * next })
  }

  return { onWheel, resetView, zoomBy }
}
