import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject, Dispatch, SetStateAction } from 'react'
import { Stage, Layer, Transformer, Line } from 'react-konva'
import type Konva from 'konva'
import { BoardObject, BoardBackground } from '@shared/lib/boards/types'
import ImageNode from '../nodes/ImageNode'
import TextNode from '../nodes/TextNode'
import StickyNode from '../nodes/StickyNode'
import ShapeNode from '../nodes/ShapeNode'
import FreehandNode from '../nodes/FreehandNode'
import GridLayer from '../layers/GridLayer'
import MeasureLayer from '../layers/MeasureLayer'
import { BoardExtLayers } from '../extensions/Host'
import type { BoardExtension, BoardExtSlotProps } from '../extensions/boardExtension'

type Vec = { x: number; y: number }
type MeasureSeg = { ax: number; ay: number; bx: number; by: number } | null
type StageEvt = Konva.KonvaEventObject<MouseEvent | TouchEvent>

const SHAPE_TYPES = ['rect', 'ellipse', 'line', 'arrow']
const isShape = (t: string) => SHAPE_TYPES.includes(t)

/**
 * Lienzo Konva: capa de fondo (cuadrícula), capa de objetos (con Transformer)
 * y capa de medición. Es presentacional: recibe estado y callbacks del editor.
 */
export default function BoardStage({
  stageRef,
  trRef,
  stageSize,
  pos,
  scale,
  onWheel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  suppressBaseGrid,
  gridColor,
  background,
  extension,
  extSlot,
  sorted,
  readOnly,
  selectedIds,
  editingId,
  tool,
  snap,
  snapVal,
  snapDrag,
  snapLines,
  gridGap,
  measure,
  tempPoints,
  onSelectObject,
  setSelectedIds,
  setEditingId,
  onUpdateObject,
}: {
  stageRef: RefObject<Konva.Stage | null>
  trRef: RefObject<Konva.Transformer | null>
  stageSize: { w: number; h: number }
  pos: Vec
  scale: number
  onWheel: (e: Konva.KonvaEventObject<WheelEvent>) => void
  onPointerDown: (e: StageEvt) => void
  onPointerMove: () => void
  onPointerUp: () => void
  /** El workspace dibuja su propio grid → el motor no pinta el uniforme. */
  suppressBaseGrid: boolean
  gridColor: string
  background: BoardBackground
  extension?: BoardExtension
  extSlot: BoardExtSlotProps
  sorted: BoardObject[]
  readOnly: boolean
  selectedIds: string[]
  editingId: string | null
  tool: 'select' | 'hand' | 'measure' | 'draw'
  snap: boolean
  snapVal: (v: number) => number
  snapDrag: (v: number, span: number) => number
  /** Líneas-imán extra (px de mundo) del workspace: x verticales, y horizontales. */
  snapLines: { x: number[]; y: number[] }
  /** Paso de grilla actual (px de mundo); define la tolerancia de las líneas-imán. */
  gridGap: number
  measure: MeasureSeg
  tempPoints: number[] | null
  onSelectObject: (id: string, additive: boolean) => void
  setSelectedIds: Dispatch<SetStateAction<string[]>>
  setEditingId: Dispatch<SetStateAction<string | null>>
  onUpdateObject: (o: BoardObject) => void
}) {
  const ctrlPressedRef = useRef(false)
  const [keepRatioResize, setKeepRatioResize] = useState(false)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        ctrlPressedRef.current = true
        setKeepRatioResize(true)
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        ctrlPressedRef.current = false
        setKeepRatioResize(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  // Handler de edición con identidad ESTABLE (setters de React son estables) →
  // no rompe la memoización de los nodos al panear/zoom.
  const onEditObject = useCallback(
    (id: string) => {
      setSelectedIds([id])
      setEditingId(id)
    },
    [setSelectedIds, setEditingId],
  )

  // No montar el Stage sin tamaño real: Konva compone las capas con
  // drawImage(layerCanvas) y un canvas 0×0 lanza InvalidStateError.
  if (stageSize.w <= 0 || stageSize.h <= 0) return null
  return (
    <Stage
      ref={stageRef}
      width={stageSize.w}
      height={stageSize.h}
      x={pos.x}
      y={pos.y}
      scaleX={scale}
      scaleY={scale}
      onWheel={onWheel}
      onMouseDown={onPointerDown}
      onTouchStart={onPointerDown}
      onMouseMove={onPointerMove}
      onTouchMove={onPointerMove}
      onMouseUp={onPointerUp}
      onTouchEnd={onPointerUp}
    >
      {/* Capa de fondo (grid milimetrado: menores 1cm + mayores 2cm).
          Auto-dirigida: lee el transform vivo del Stage. `suppressBaseGrid` (el
          workspace dibuja su propio grid) → tipo 'plain' = no dibuja nada. */}
      <GridLayer type={suppressBaseGrid ? 'plain' : background.type} squareCm={background.squareCm} color={gridColor} opacity={background.opacity} />

      {/* Capa de la extensión del workspace (guías/huellas), si la hay. */}
      <BoardExtLayers extension={extension} slot={extSlot} />

      {/* Capa de objetos.
          Los nodos están memoizados y reciben SOLO props estables/primitivas
          (handlers de identidad fija, booleanos derivados) → al panear/zoom no
          se re-renderizan salvo que cambien sus propios datos. */}
      <Layer>
        {sorted.map((obj) => {
          const draggable = tool === 'select' && !obj.locked && !readOnly
          if (obj.type === 'image')
            return <ImageNode key={obj.id} obj={obj} isSelected={selectedIds.includes(obj.id)} onSelect={onSelectObject} onChange={onUpdateObject} readOnly={readOnly} snap={snap} snapVal={snapVal} snapDrag={snapDrag} draggable={draggable} scale={scale} />
          if (obj.type === 'text')
            return <TextNode key={obj.id} obj={obj} editing={obj.id === editingId} onSelect={onSelectObject} onEdit={onEditObject} onChange={onUpdateObject} readOnly={readOnly} snap={snap} snapVal={snapVal} snapDrag={snapDrag} draggable={draggable} />
          if (obj.type === 'sticky')
            return <StickyNode key={obj.id} obj={obj} editing={obj.id === editingId} onSelect={onSelectObject} onEdit={onEditObject} onChange={onUpdateObject} readOnly={readOnly} snap={snap} snapVal={snapVal} snapDrag={snapDrag} draggable={draggable} />
          if (isShape(obj.type))
            return <ShapeNode key={obj.id} obj={obj} onSelect={onSelectObject} onChange={onUpdateObject} readOnly={readOnly} snap={snap} snapVal={snapVal} snapDrag={snapDrag} draggable={draggable} />
          if (obj.type === 'freehand')
            return <FreehandNode key={obj.id} obj={obj} onSelect={onSelectObject} onChange={onUpdateObject} readOnly={readOnly} snap={snap} snapVal={snapVal} snapDrag={snapDrag} draggable={draggable} />
          return null
        })}
        {tempPoints && tempPoints.length >= 4 && (
          <Line
            points={tempPoints}
            stroke="var(--color-primary, #a78bfa)"
            strokeWidth={3}
            tension={0.35}
            lineCap="round"
            lineJoin="round"
            opacity={0.85}
            perfectDrawEnabled={false}
          />
        )}
        {!readOnly && (
          <Transformer
            ref={(node) => {
              trRef.current = node;
            }}
            perfectDrawEnabled={false}
            rotateEnabled
            keepRatio={keepRatioResize}
            strokeScaleEnabled={false}
            rotationSnapTolerance={4}
            rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
            borderStroke="red"
            borderStrokeWidth={1.5}
            anchorStroke="white"
            anchorFill="#333"
            anchorSize={10}
            anchorCornerRadius={2}
            anchorStrokeWidth={1.5}
            rotateAnchorStroke="white"
            boundBoxFunc={(oldBox, newBox) => {
              // `boundBoxFunc` opera en coords ABSOLUTAS (pantalla): incluyen el
              // scale y la posición del Stage. El imán (`snapVal`) vive en coords
              // de MUNDO, así que hay que convertir ida y vuelta o solo cuadra a
              // zoom 100% sin paneo.
              const MIN = 5 // px de mundo (candado anti-NaN: nunca 0/negativo)

              // Sin imán o con rotación: solo aplicamos el tamaño mínimo. Snappear
              // bordes axis-aligned de una caja rotada produce saltos erráticos.
              if (!snap || Math.abs(newBox.rotation) > 0.001) {
                const minAbs = MIN * scale
                return {
                  ...newBox,
                  width: Math.max(minAbs, newBox.width),
                  height: Math.max(minAbs, newBox.height),
                }
              }

              const toWX = (v: number) => (v - pos.x) / scale
              const toWY = (v: number) => (v - pos.y) / scale

              // Las líneas-imán del workspace (bordes de la regla Carnaval) tienen
              // PRIORIDAD sobre la grilla dentro de media casilla: si solo se usara
              // "la más cercana", cuando un borde de la regla cae junto a una línea
              // de grid (vistas frontal/posterior) ganaría el grid y nunca podrías
              // aterrizar exacto en la regla. Fuera de la tolerancia, grid normal.
              const tol = gridGap * 0.5
              const snapEdge = (v: number, lines: number[]) => {
                let nearest: number | null = null
                let nd = Infinity
                for (const L of lines) {
                  const d = Math.abs(L - v)
                  if (d < nd) { nd = d; nearest = L }
                }
                if (nearest !== null && nd <= tol) return nearest
                return snapVal(v)
              }

              let left = toWX(newBox.x)
              let right = toWX(newBox.x + newBox.width)
              let top = toWY(newBox.y)
              let bottom = toWY(newBox.y + newBox.height)

              // Solo se imanta el borde que el usuario está moviendo (el opuesto
              // queda fijo aunque no caiga en la grilla).
              const movingLeft = Math.abs(left - toWX(oldBox.x)) > 0.01
              const movingRight = Math.abs(right - toWX(oldBox.x + oldBox.width)) > 0.01
              const movingTop = Math.abs(top - toWY(oldBox.y)) > 0.01
              const movingBottom = Math.abs(bottom - toWY(oldBox.y + oldBox.height)) > 0.01

              if (movingLeft) left = snapEdge(left, snapLines.x)
              if (movingRight) right = snapEdge(right, snapLines.x)
              if (movingTop) top = snapEdge(top, snapLines.y)
              if (movingBottom) bottom = snapEdge(bottom, snapLines.y)

              if (right - left < MIN) {
                if (movingLeft) left = right - MIN
                else right = left + MIN
              }
              if (bottom - top < MIN) {
                if (movingTop) top = bottom - MIN
                else bottom = top + MIN
              }

              return {
                ...newBox,
                x: left * scale + pos.x,
                y: top * scale + pos.y,
                width: (right - left) * scale,
                height: (bottom - top) * scale,
              }
            }}
          />
        )}
      </Layer>

      {/* Capa de medición (regla) */}
      {measure && <MeasureLayer measure={measure} scale={scale} />}
    </Stage>
  )
}
