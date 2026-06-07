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

interface StagePointerDeps {
  readOnly: boolean
  tool: 'select' | 'hand' | 'measure'
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
}

/**
 * Maquinaria de puntero del escenario: despacha entre regla (measure), paneo
 * por arrastre (mano/espacio/botón central) y selección por recuadro (rubber
 * band) según la herramienta activa. Las tres comparten down/move/up.
 */
export function useStagePointer(d: StagePointerDeps) {
  const measuring = useRef(false)
  const panning = useRef<{ x: number; y: number; px: number; py: number } | null>(null)
  // Última posición del Stage durante un paneo imperativo (se confirma al soltar).
  const lastPan = useRef<Vec | null>(null)
  const selStart = useRef<{ x: number; y: number; additive: boolean } | null>(null)

  const panMode = d.spaceHeld || d.tool === 'hand'

  const onStagePointerDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (d.readOnly) return
    const p = d.stageRef.current?.getPointerPosition()
    if (!p) return
    const isMiddle = 'button' in e.evt && e.evt.button === 1
    // Herramienta regla: traza A→B (no panea/selecciona salvo botón central).
    if (d.tool === 'measure' && !isMiddle && !d.spaceHeld) {
      const w = d.toWorld(p.x, p.y)
      measuring.current = true
      d.setMeasure({ ax: w.x, ay: w.y, bx: w.x, by: w.y })
      return
    }
    // Paneo: herramienta mano, espacio mantenido o botón central (sobre lo que sea).
    // El botón central convierte temporalmente la selección en "mover tablero".
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
    if (measuring.current) {
      const w = d.toWorld(p.x, p.y)
      d.setMeasure((m) => (m ? { ...m, bx: w.x, by: w.y } : m))
      return
    }
    if (panning.current) {
      // Paneo IMPERATIVO: mueve el Stage por ref + `batchDraw`, SIN setState. Así
      // no hay re-render por frame (React no es la fuente durante el gesto) → las
      // grillas auto-dirigidas y los nodos siguen al transform sin reconcile. La
      // posición final se confirma a React al soltar (`onStagePointerUp`).
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
    if (measuring.current) {
      measuring.current = false
      return
    }
    if (panning.current) {
      panning.current = null
      d.setDragPanning(false)
      // Confirma a React la posición final del paneo imperativo (un solo render).
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
