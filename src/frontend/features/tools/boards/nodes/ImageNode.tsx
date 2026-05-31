'use client'

import { useEffect, useRef, useState } from 'react'
import { Image as KonvaImage } from 'react-konva'
import type Konva from 'konva'
import type { BaseNodeProps } from './types'

/** Nodo imagen: gestiona su propio HTMLImageElement. */
export default function ImageNode({
  obj,
  isSelected,
  onSelect,
  onChange,
  snap,
  snapVal,
  draggable,
}: BaseNodeProps & { isSelected: boolean }) {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const ref = useRef<Konva.Image>(null)

  useEffect(() => {
    if (!obj.src) return
    const image = new window.Image()
    image.crossOrigin = 'anonymous'
    image.src = obj.src
    image.onload = () => setImg(image)
  }, [obj.src])

  return (
    <KonvaImage
      ref={ref}
      name={obj.id}
      image={img ?? undefined}
      x={obj.x}
      y={obj.y}
      width={obj.w}
      height={obj.h}
      rotation={obj.rotation}
      opacity={(obj.opacity ?? 100) / 100}
      visible={obj.visible !== false}
      draggable={draggable}
      onClick={(e) => onSelect(e.evt.shiftKey)}
      onTap={(e) => onSelect(e.evt.shiftKey)}
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
          w: Math.max(20, node.width() * scaleX),
          h: Math.max(20, node.height() * scaleY),
          rotation: node.rotation(),
        })
      }}
      shadowColor={isSelected ? '#000' : undefined}
      shadowBlur={isSelected ? 8 : 0}
      shadowOpacity={0.3}
    />
  )
}
