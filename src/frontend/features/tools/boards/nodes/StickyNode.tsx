'use client'

import { memo, useRef } from 'react'
import { Group, Rect, Text as KonvaText } from 'react-konva'
import type Konva from 'konva'
import { DEFAULT_FONT, konvaFontStyle } from '@shared/lib/boards/types'
import type { BaseNodeProps } from './types'

/** Nota adhesiva (rect + texto). */
function StickyNode({
  obj,
  editing,
  onSelect,
  onEdit,
  onChange,
  readOnly,
  snap,
  snapDrag,
  draggable,
}: BaseNodeProps & { editing: boolean; onEdit: (id: string) => void }) {
  const groupRef = useRef<Konva.Group>(null)

  return (
    <Group
      ref={groupRef}
      name={obj.id}
      x={obj.x}
      y={obj.y}
      rotation={obj.rotation}
      opacity={(obj.opacity ?? 100) / 100}
      visible={obj.visible !== false && !editing}
      draggable={draggable && !editing}
      onClick={(e) => !readOnly && onSelect(obj.id, e.evt.shiftKey)}
      onTap={(e) => !readOnly && onSelect(obj.id, e.evt.shiftKey)}
      onDblClick={() => !readOnly && !obj.locked && onEdit(obj.id)}
      onDblTap={() => !readOnly && !obj.locked && onEdit(obj.id)}
      onDragMove={(e) => {
        if (snap) {
          e.target.x(snapDrag(e.target.x(), obj.w ?? 0))
          e.target.y(snapDrag(e.target.y(), obj.h ?? 0))
        }
      }}
      onDragEnd={(e) => onChange({ ...obj, x: e.target.x(), y: e.target.y() })}
      onTransformEnd={() => {
        const node = groupRef.current
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

export default memo(StickyNode)
