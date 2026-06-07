'use client'

import { memo, useRef } from 'react'
import { Text as KonvaText } from 'react-konva'
import type Konva from 'konva'
import { DEFAULT_FONT, konvaFontStyle } from '@shared/lib/boards/types'
import type { BaseNodeProps } from './types'

/** Nodo de texto libre. */
function TextNode({
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
  const ref = useRef<Konva.Text>(null)
  return (
    <KonvaText
      ref={ref}
      name={obj.id}
      text={obj.text || ' '}
      x={obj.x}
      y={obj.y}
      width={obj.w}
      rotation={obj.rotation}
      opacity={(obj.opacity ?? 100) / 100}
      visible={obj.visible !== false && !editing}
      fontSize={obj.fontSize || 24}
      fontFamily={obj.fontFamily || DEFAULT_FONT}
      fontStyle={konvaFontStyle(obj)}
      textDecoration={obj.underline ? 'underline' : ''}
      fill={obj.color || '#e8e8e8'}
      align={obj.align || 'left'}
      draggable={draggable}
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
        const node = ref.current
        if (!node) return
        const scaleX = node.scaleX()
        node.scaleX(1)
        node.scaleY(1)
        onChange({ ...obj, x: node.x(), y: node.y(), w: Math.max(30, node.width() * scaleX), rotation: node.rotation() })
      }}
    />
  )
}

export default memo(TextNode)
