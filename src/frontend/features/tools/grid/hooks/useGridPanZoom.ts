import { useRef } from 'react'
import type { RefObject, Dispatch, SetStateAction } from 'react'
import type { GridSnapshot } from './useGridHistory'

type Vec = { x: number; y: number }

interface GridPanZoomDeps {
  imageUrl: string | null
  frameRef: RefObject<HTMLDivElement | null>
  zoom: number
  pan: Vec
  setZoom: Dispatch<SetStateAction<number>>
  setPan: Dispatch<SetStateAction<Vec>>
  pushSnapshot: (override?: Partial<GridSnapshot>) => void
}

/**
 * Paneo por arrastre y zoom con rueda (hacia el cursor) del lienzo de
 * referencia. Empuja un snapshot al iniciar cada gesto para que undo agrupe el
 * gesto completo. `resetView` centra y restaura el zoom.
 */
export function useGridPanZoom({ imageUrl, frameRef, zoom, pan, setZoom, setPan, pushSnapshot }: GridPanZoomDeps) {
  const dragging = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null)
  const wheeling = useRef(false)
  const wheelTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const onPointerDown = (e: React.PointerEvent) => {
    if (!imageUrl) return
    pushSnapshot()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    dragging.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return
    setPan({
      x: dragging.current.panX + (e.clientX - dragging.current.startX),
      y: dragging.current.panY + (e.clientY - dragging.current.startY),
    })
  }
  const onPointerUp = () => {
    dragging.current = null
  }

  const onWheel = (e: React.WheelEvent) => {
    if (!imageUrl) return
    e.preventDefault() // evita scroll de página
    if (!wheeling.current) {
      pushSnapshot()
      wheeling.current = true
    }
    const delta = e.deltaY * -0.001
    const nextZoom = Math.min(Math.max(0.1, zoom * (1 + delta)), 5)

    // Zoom hacia el cursor: desplaza el pan para mantenerlo fijo.
    const f = frameRef.current
    if (f) {
      const rect = f.getBoundingClientRect()
      const px = e.clientX - rect.left - rect.width / 2
      const py = e.clientY - rect.top - rect.height / 2
      const scaleChange = nextZoom - zoom
      setPan((p) => ({
        x: p.x - (px * scaleChange) / zoom,
        y: p.y - (py * scaleChange) / zoom,
      }))
    }
    setZoom(nextZoom)

    if (wheelTimer.current) clearTimeout(wheelTimer.current)
    wheelTimer.current = setTimeout(() => { wheeling.current = false }, 500)
  }

  const resetView = () => {
    pushSnapshot()
    setPan({ x: 0, y: 0 })
    setZoom(1)
  }

  return { onPointerDown, onPointerMove, onPointerUp, onWheel, resetView }
}
