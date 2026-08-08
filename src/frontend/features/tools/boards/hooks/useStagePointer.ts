import { useRef } from 'react'
import type { RefObject, Dispatch, SetStateAction } from 'react'
import type Konva from 'konva'
import { BoardObject } from '@shared/lib/boards/types'

type Vec = { x: number; y: number }
type MeasureSeg = { ax: number; ay: number; bx: number; by: number } | null
type SelRect = { x: number; y: number; w: number; h: number } | null

const rectsIntersect = (
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; w: number; h: number },
) => !(a.x + a.width < b.x || a.x > b.x + b.w || a.y + a.height < b.y || a.y > b.y + b.h)

/** Algoritmo Ramer-Douglas-Peucker para simplificar trazos */
function simplifyRDP(points: number[], epsilon: number): number[] {
  if (points.length <= 4) return points

  let maxSqDist = 0
  let index = -1
  const endIdx = points.length - 2
  const ax = points[0]
  const ay = points[1]
  const bx = points[endIdx]
  const by = points[endIdx + 1]

  for (let i = 2; i < endIdx; i += 2) {
    const px = points[i]
    const py = points[i + 1]
    const sqDist = getSqSegDist(px, py, ax, ay, bx, by)
    if (sqDist > maxSqDist) {
      index = i
      maxSqDist = sqDist
    }
  }

  if (maxSqDist > epsilon * epsilon) {
    const results1 = simplifyRDP(points.slice(0, index + 2), epsilon)
    const results2 = simplifyRDP(points.slice(index), epsilon)
    return results1.slice(0, results1.length - 2).concat(results2)
  }

  return [ax, ay, bx, by]
}

function getSqSegDist(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  let x = ax
  let y = ay
  let dx = bx - ax
  let dy = by - ay

  if (dx !== 0 || dy !== 0) {
    const t = ((px - x) * dx + (py - y) * dy) / (dx * dx + dy * dy)
    if (t > 1) {
      x = bx
      y = by
    } else if (t > 0) {
      x += dx * t
      y += dy * t
    }
  }

  const dx2 = px - x
  const dy2 = py - y
  return dx2 * dx2 + dy2 * dy2
}

interface StagePointerDeps {
  readOnly: boolean
  tool: 'select' | 'hand' | 'measure' | 'draw'
  spaceHeld: boolean
  pos: Vec
  objects: BoardObject[]
  stageRef: RefObject<Konva.Stage | null>
  toWorld: (sx: number, sy: number) => Vec
  setMeasure: Dispatch<SetStateAction<MeasureSeg>>
  setPos: Dispatch<SetStateAction<Vec>>
  setSelectedIds: Dispatch<SetStateAction<string[]>>
  setSelRect: Dispatch<SetStateAction<SelRect>>
  /** Paneo activo por arrastre (botón central / espacio / mano): para feedback de cursor. */
  setDragPanning: Dispatch<SetStateAction<boolean>>
  /** Calbacks para el dibujo */
  onDrawMove: (points: number[] | null) => void
  onDrawComplete: (points: number[], rect: { x: number; y: number; w: number; h: number }) => void
}

/**
 * Maquinaria de puntero del escenario: despacha entre regla (measure), dibujo (draw),
 * paneo por arrastre (mano/espacio/botón central) y selección por recuadro.
 */
export function useStagePointer(d: StagePointerDeps) {
  const measuring = useRef(false)
  const panning = useRef<{ x: number; y: number; px: number; py: number } | null>(null)
  const lastPan = useRef<Vec | null>(null)
  const selStart = useRef<{ x: number; y: number; additive: boolean } | null>(null)

  // Referencias para el dibujo libre con estabilizador
  const drawingPoints = useRef<number[]>([])
  const lastStabilized = useRef<Vec | null>(null)

  const panMode = d.spaceHeld || d.tool === 'hand'

  const onStagePointerDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (d.readOnly) return
    const p = d.stageRef.current?.getPointerPosition()
    if (!p) return
    const isMiddle = 'button' in e.evt && e.evt.button === 1

    // Herramienta Lápiz: inicia el trazo estabilizado
    if (d.tool === 'draw' && !isMiddle && !d.spaceHeld) {
      e.evt.preventDefault?.()
      const w = d.toWorld(p.x, p.y)
      drawingPoints.current = [w.x, w.y]
      lastStabilized.current = { x: w.x, y: w.y }
      d.onDrawMove([w.x, w.y])
      return
    }

    // Herramienta regla: traza A→B (no panea/selecciona salvo botón central).
    if (d.tool === 'measure' && !isMiddle && !d.spaceHeld) {
      const w = d.toWorld(p.x, p.y)
      measuring.current = true
      d.setMeasure({ ax: w.x, ay: w.y, bx: w.x, by: w.y })
      return
    }
    // Paneo: herramienta mano, espacio mantenido o botón central (sobre lo que sea).
    if (panMode || isMiddle) {
      e.evt.preventDefault?.()
      panning.current = { x: p.x, y: p.y, px: d.pos.x, py: d.pos.y }
      d.setDragPanning(true)
      return
    }
    // Selección por recuadro: solo sobre lienzo vacío.
    if (e.target !== e.target.getStage()) return
    const additive = 'shiftKey' in e.evt ? e.evt.shiftKey : false
    selStart.current = { x: p.x, y: p.y, additive }
    if (!additive) d.setSelectedIds([])
    d.setSelRect({ x: p.x, y: p.y, w: 0, h: 0 })
  }

  const onStagePointerMove = () => {
    const p = d.stageRef.current?.getPointerPosition()
    if (!p) return

    // Dibujo en curso con suavizado por estabilizador físico
    if (d.tool === 'draw' && lastStabilized.current) {
      const w = d.toWorld(p.x, p.y)
      const factor = 0.22 // Amortiguamiento: valor menor = más estabilidad y suavizado
      const nextX = lastStabilized.current.x + (w.x - lastStabilized.current.x) * factor
      const nextY = lastStabilized.current.y + (w.y - lastStabilized.current.y) * factor
      lastStabilized.current = { x: nextX, y: nextY }

      const pts = drawingPoints.current
      const lx = pts[pts.length - 2]
      const ly = pts[pts.length - 1]
      const dist = Math.hypot(nextX - lx, nextY - ly)

      if (dist > 1.2) { // Evita registrar puntos estáticos o de vibración ínfima
        pts.push(nextX, nextY)
        d.onDrawMove([...pts])
      }
      return
    }

    if (measuring.current) {
      const w = d.toWorld(p.x, p.y)
      d.setMeasure((m) => (m ? { ...m, bx: w.x, by: w.y } : m))
      return
    }
    if (panning.current) {
      const pn = panning.current
      const nx = pn.px + (p.x - pn.x)
      const ny = pn.py + (p.y - pn.y)
      const stage = d.stageRef.current
      if (stage) {
        stage.x(nx)
        stage.y(ny)
        stage.batchDraw()
        lastPan.current = { x: nx, y: ny }
      }
      return
    }
    const s = selStart.current
    if (!s) return
    d.setSelRect({ x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y) })
  }

  const onStagePointerUp = () => {
    // Finalizar dibujo
    if (d.tool === 'draw' && lastStabilized.current) {
      lastStabilized.current = null
      const pts = drawingPoints.current
      d.onDrawMove(null)
      drawingPoints.current = []

      if (pts.length >= 4) {
        // 1. Simplificación RDP para evitar exceso de vértices redundantes
        const simplified = simplifyRDP(pts, 0.8)
        if (simplified.length < 4) return

        // 2. Calcular límites (Bounding Box)
        let minX = Infinity, minY = Infinity
        let maxX = -Infinity, maxY = -Infinity
        for (let i = 0; i < simplified.length; i += 2) {
          const x = simplified[i]
          const y = simplified[i + 1]
          if (x < minX) minX = x
          if (y < minY) minY = y
          if (x > maxX) maxX = x
          if (y > maxY) maxY = y
        }

        const w = Math.max(5, maxX - minX)
        const h = Math.max(5, maxY - minY)

        // 3. Normalizar puntos a coordenadas relativas al grupo
        const normalized = []
        for (let i = 0; i < simplified.length; i += 2) {
          normalized.push(simplified[i] - minX, simplified[i + 1] - minY)
        }

        d.onDrawComplete(normalized, { x: minX, y: minY, w, h })
      }
      return
    }

    if (measuring.current) {
      measuring.current = false
      return
    }
    if (panning.current) {
      panning.current = null
      d.setDragPanning(false)
      if (lastPan.current) {
        d.setPos(lastPan.current)
        lastPan.current = null
      }
      return
    }
    const s = selStart.current
    selStart.current = null
    const stage = d.stageRef.current
    const p = stage?.getPointerPosition()
    d.setSelRect(null)
    if (!s || !stage || !p) return
    const box = { x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y) }
    if (box.w < 3 && box.h < 3) return // fue un click, no un arrastre
    const ids: string[] = []
    for (const obj of d.objects) {
      const node = stage.findOne(`.${obj.id}`)
      if (node && rectsIntersect(node.getClientRect(), box)) ids.push(obj.id)
    }
    d.setSelectedIds((prev) => (s.additive ? Array.from(new Set([...prev, ...ids])) : ids))
  }

  return { panMode, onStagePointerDown, onStagePointerMove, onStagePointerUp }
}
