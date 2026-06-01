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
  sorted,
  readOnly,
  selectedIds,
  editingId,
  tool,
  snap,
  snapVal,
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
  sorted: BoardObject[]
  readOnly: boolean
  selectedIds: string[]
  editingId: string | null
  tool: 'select' | 'hand' | 'measure'
  snap: boolean
  snapVal: (v: number) => number
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

      {/* Capa de objetos */}
      <Layer>
        {sorted.map((obj) => {
          const onSelect = (additive: boolean) => !readOnly && onSelectObject(obj.id, additive)
          const onEdit = () => !readOnly && !obj.locked && (setSelectedIds([obj.id]), setEditingId(obj.id))
          const draggable = tool === 'select' && !obj.locked && !readOnly
          if (obj.type === 'image')
            return <ImageNode key={obj.id} obj={obj} isSelected={selectedIds.includes(obj.id)} onSelect={onSelect} onChange={onUpdateObject} snap={snap} snapVal={snapVal} draggable={draggable} />
          if (obj.type === 'text')
            return <TextNode key={obj.id} obj={obj} editing={obj.id === editingId} onSelect={onSelect} onEdit={onEdit} onChange={onUpdateObject} snap={snap} snapVal={snapVal} draggable={draggable} />
          if (obj.type === 'sticky')
            return <StickyNode key={obj.id} obj={obj} editing={obj.id === editingId} onSelect={onSelect} onEdit={onEdit} onChange={onUpdateObject} snap={snap} snapVal={snapVal} draggable={draggable} />
          if (isShape(obj.type))
            return <ShapeNode key={obj.id} obj={obj} onSelect={onSelect} onChange={onUpdateObject} snap={snap} snapVal={snapVal} draggable={draggable} />
          return null
        })}
        {!readOnly && (
          <Transformer
            ref={trRef}
            rotateEnabled
            keepRatio={false}
            rotationSnapTolerance={4}
            rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
            ignoreStroke
            boundBoxFunc={(oldBox, newBox) =>
              // Rechaza solo si ambas dimensiones son diminutas (permite
              // líneas/flechas finas, cuyo alto ≈ grosor).
              Math.abs(newBox.width) < 5 && Math.abs(newBox.height) < 5 ? oldBox : newBox
            }
          />
        )}
      </Layer>

      {/* Capa de medición (regla) */}
      {measure && <MeasureLayer measure={measure} scale={scale} />}
    </Stage>
  )
}
