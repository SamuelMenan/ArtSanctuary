import type { RefObject, Dispatch, SetStateAction } from 'react'
import { Stage, Layer, Transformer } from 'react-konva'
import type Konva from 'konva'
import { BoardObject, BoardBackground } from '@shared/lib/boards/types'
import ImageNode from '../nodes/ImageNode'
import TextNode from '../nodes/TextNode'
import StickyNode from '../nodes/StickyNode'
import ShapeNode from '../nodes/ShapeNode'
import GridLayer from '../layers/GridLayer'
import MeasureLayer from '../layers/MeasureLayer'
import type { GridLines } from '../lib/grid'
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
  gridLines,
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
  gridLines: GridLines
  gridColor: string
  background: BoardBackground
  extension?: BoardExtension
  extSlot: BoardExtSlotProps
  sorted: BoardObject[]
  readOnly: boolean
  selectedIds: string[]
  editingId: string | null
  tool: 'select' | 'hand' | 'measure'
  snap: boolean
  snapVal: (v: number) => number
  snapDrag: (v: number, span: number) => number
  /** Líneas-imán extra (px de mundo) del workspace: x verticales, y horizontales. */
  snapLines: { x: number[]; y: number[] }
  /** Paso de grilla actual (px de mundo); define la tolerancia de las líneas-imán. */
  gridGap: number
  measure: MeasureSeg
  onSelectObject: (id: string, additive: boolean) => void
  setSelectedIds: Dispatch<SetStateAction<string[]>>
  setEditingId: Dispatch<SetStateAction<string | null>>
  onUpdateObject: (o: BoardObject) => void
}) {
  if (stageSize.w === 0) return null
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
      {/* Capa de fondo (grid milimetrado: menores 1cm + mayores 2cm) */}
      <GridLayer lines={gridLines} color={gridColor} scale={scale} opacity={background.opacity} />

      {/* Capa de la extensión del workspace (guías/huellas), si la hay. */}
      <BoardExtLayers extension={extension} slot={extSlot} />

      {/* Capa de objetos */}
      <Layer>
        {sorted.map((obj) => {
          const onSelect = (additive: boolean) => !readOnly && onSelectObject(obj.id, additive)
          const onEdit = () => !readOnly && !obj.locked && (setSelectedIds([obj.id]), setEditingId(obj.id))
          const draggable = tool === 'select' && !obj.locked && !readOnly
          if (obj.type === 'image')
            return <ImageNode key={obj.id} obj={obj} isSelected={selectedIds.includes(obj.id)} onSelect={onSelect} onChange={onUpdateObject} snap={snap} snapVal={snapVal} snapDrag={snapDrag} draggable={draggable} scale={scale} />
          if (obj.type === 'text')
            return <TextNode key={obj.id} obj={obj} editing={obj.id === editingId} onSelect={onSelect} onEdit={onEdit} onChange={onUpdateObject} snap={snap} snapVal={snapVal} snapDrag={snapDrag} draggable={draggable} />
          if (obj.type === 'sticky')
            return <StickyNode key={obj.id} obj={obj} editing={obj.id === editingId} onSelect={onSelect} onEdit={onEdit} onChange={onUpdateObject} snap={snap} snapVal={snapVal} snapDrag={snapDrag} draggable={draggable} />
          if (isShape(obj.type))
            return <ShapeNode key={obj.id} obj={obj} onSelect={onSelect} onChange={onUpdateObject} snap={snap} snapVal={snapVal} snapDrag={snapDrag} draggable={draggable} />
          return null
        })}
        {!readOnly && (
          <Transformer
            ref={(node) => {
              trRef.current = node;
            }}
            rotateEnabled
            keepRatio={false}
            rotationSnapTolerance={4}
            rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
            ignoreStroke
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
