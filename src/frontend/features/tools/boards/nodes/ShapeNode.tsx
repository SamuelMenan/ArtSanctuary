'use client'

import { useRef } from 'react'
import { Group, Rect, Ellipse, Line, Arrow } from 'react-konva'
import type Konva from 'konva'
import type { BaseNodeProps } from './types'

/** Figura geométrica (rect / elipse / línea / flecha). */
export default function ShapeNode({ obj, onSelect, onChange, snap, snapVal, snapDrag, draggable }: BaseNodeProps) {
  const ref = useRef<Konva.Group>(null)
  // 'transparent' (no undefined) mantiene el interior clicable aunque esté vacío.
  const fill = obj.fill ?? 'transparent'
  const stroke = obj.stroke ?? '#e8e8e8'
  const strokeWidth = obj.strokeWidth ?? 2

  // Geometría centrada en el origen del Group → rota/escala desde el centro
  // (no desde la esquina). El modelo sigue guardando x,y como esquina sup-izq.
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
      onClick={(e) => onSelect(e.evt.shiftKey)}
      onTap={(e) => onSelect(e.evt.shiftKey)}
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
        const h = Math.max(0, obj.h * scaleY)
        onChange({
          ...obj,
          w,
          h,
          rotation: node.rotation(),
          x: node.x() - w / 2,
          y: node.y() - h / 2,
        })
      }}
    >
      {obj.type === 'rect' && (
        <Rect x={-cx} y={-cy} width={obj.w} height={obj.h} fill={fill} stroke={stroke} strokeWidth={strokeWidth} cornerRadius={4} />
      )}
      {obj.type === 'ellipse' && (
        <Ellipse x={0} y={0} radiusX={cx} radiusY={cy} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      )}
      {obj.type === 'line' && (
        <Line points={[-cx, -cy, cx, cy]} stroke={stroke} strokeWidth={strokeWidth} lineCap="round" hitStrokeWidth={Math.max(12, strokeWidth)} />
      )}
      {obj.type === 'arrow' && (
        <Arrow points={[-cx, -cy, cx, cy]} stroke={stroke} fill={stroke} strokeWidth={strokeWidth} pointerLength={10 + strokeWidth} pointerWidth={10 + strokeWidth} hitStrokeWidth={Math.max(12, strokeWidth)} />
      )}
    </Group>
  )
}
