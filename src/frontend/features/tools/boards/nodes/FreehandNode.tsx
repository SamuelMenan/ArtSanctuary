'use client'

import { memo, useRef } from 'react'
import { Group, Line } from 'react-konva'
import type Konva from 'konva'
import type { BaseNodeProps } from './types'

/** Trazo libre a mano alzada con estabilizador y suavizado spline. */
function FreehandNode({ obj, onSelect, onChange, readOnly, snap, snapDrag, draggable }: BaseNodeProps) {
  const ref = useRef<Konva.Group>(null)
  const stroke = obj.stroke ?? '#e8e8e8'
  const strokeWidth = obj.strokeWidth ?? 3

  // Centrar el origen en el medio de la caja limitadora para rotar y escalar correctamente
  const cx = obj.w / 2
  const cy = obj.h / 2

  return (
    <Group
      ref={ref}
      name={obj.id}
      x={obj.x + cx}
      y={obj.y + cy}
      rotation={obj.rotation}
      opacity={(obj.opacity ?? 100) / 100}
      visible={obj.visible !== false}
      draggable={draggable}
      onClick={(e) => !readOnly && onSelect(obj.id, e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey)}
      onTap={(e) => !readOnly && onSelect(obj.id, e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey)}
      onDragMove={(e) => {
        if (snap) {
          e.target.x(snapDrag(e.target.x() - cx, obj.w) + cx)
          e.target.y(snapDrag(e.target.y() - cy, obj.h) + cy)
        }
      }}
      onDragEnd={(e) => onChange({ ...obj, x: e.target.x() - cx, y: e.target.y() - cy })}
      onTransformEnd={() => {
        const node = ref.current
        if (!node) return
        const scaleX = node.scaleX()
        const scaleY = node.scaleY()
        node.scaleX(1)
        node.scaleY(1)
        const w = Math.max(5, obj.w * scaleX)
        const h = Math.max(5, obj.h * scaleY)

        // Escalar los puntos internos para que coincidan con la nueva escala del bounding box
        const scaledPoints = obj.points ? [...obj.points] : []
        if (obj.points) {
          for (let i = 0; i < obj.points.length; i += 2) {
            scaledPoints[i] = obj.points[i] * scaleX
            scaledPoints[i + 1] = obj.points[i + 1] * scaleY
          }
        }

        onChange({
          ...obj,
          w,
          h,
          points: scaledPoints,
          rotation: node.rotation(),
          x: node.x() - w / 2,
          y: node.y() - h / 2,
        })
      }}
    >
      <Line
        x={-cx}
        y={-cy}
        points={obj.points || []}
        stroke={stroke}
        strokeWidth={strokeWidth}
        tension={0.35} // Activa suavizado por Catmull-Rom spline
        lineCap="round"
        lineJoin="round"
        perfectDrawEnabled={false} // Optimización de renderizado
        hitStrokeWidth={Math.max(12, strokeWidth)} // Aumenta zona interactiva del click
      />
    </Group>
  )
}

export default memo(FreehandNode)
