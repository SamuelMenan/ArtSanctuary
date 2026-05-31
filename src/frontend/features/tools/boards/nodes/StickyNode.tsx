'use client'

import { useRef } from 'react'
import { Group, Rect, Text as KonvaText } from 'react-konva'
import type Konva from 'konva'
import { DEFAULT_FONT, konvaFontStyle } from '@shared/lib/boards/types'
import type { BaseNodeProps } from './types'

/** Nota adhesiva (rect + texto). */
export default function StickyNode({
  obj,
  editing,
  onSelect,
  onEdit,
  onChange,
  snap,
  snapVal,
  draggable,
}: BaseNodeProps & { editing: boolean; onEdit: () => void }) {
  const ref = useRef<Konva.Group>(null)
  return (
    <Group
      ref={ref}
      name={obj.id}
      x={obj.x}
      y={obj.y}
      rotation={obj.rotation}
      opacity={(obj.opacity ?? 100) / 100}
      visible={obj.visible !== false}
      draggable={draggable}
      onClick={(e) => onSelect(e.evt.shiftKey)}
      onTap={(e) => onSelect(e.evt.shiftKey)}
      onDblClick={onEdit}
      onDblTap={onEdit}
      onDragMove={(e) => {
        if (snap) {
          e.target.x(snapVal(e.target.x()))
          e.target.y(snapVal(e.target.y()))
        }
      }}
      onDragEnd={(e) => onChange({ ...obj, x: e.target.x(), y: e.target.y() })}
      onTransformEnd={() => {
        const node = ref.current
        if (!node) return
        const scaleX = node.scaleX()
        const scaleY = node.scaleY()
        node.scaleX(1)
        node.scaleY(1)
        onChange({
          ...obj,
          x: node.x(),
          y: node.y(),
          w: Math.max(40, obj.w * scaleX),
          h: Math.max(40, obj.h * scaleY),
          rotation: node.rotation(),
        })
      }}
    >
      <Rect width={obj.w} height={obj.h} fill={obj.color || '#FDE68A'} cornerRadius={4} shadowColor="#000" shadowBlur={6} shadowOpacity={0.2} shadowOffsetY={2} />
      <KonvaText
        visible={!editing}
        text={obj.text || ' '}
        width={obj.w}
        height={obj.h}
        padding={10}
        fontSize={obj.fontSize || 18}
        fontFamily={obj.fontFamily || DEFAULT_FONT}
        fontStyle={konvaFontStyle(obj)}
        textDecoration={obj.underline ? 'underline' : ''}
        fill={obj.textColor || '#1f2937'}
        align={obj.align || 'left'}
        verticalAlign="top"
      />
    </Group>
  )
}
