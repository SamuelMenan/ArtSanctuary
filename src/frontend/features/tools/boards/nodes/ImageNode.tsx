'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Image as KonvaImage, Group, Line, Text } from 'react-konva'
import type Konva from 'konva'
import { cmOf, PX_PER_CM } from '@shared/lib/measure'
import { colLabel } from '@frontend/features/tools/grid/lib/colLabel'
import type { BaseNodeProps } from './types'

/** Nodo imagen: gestiona su propio HTMLImageElement. Opcionalmente superpone una
 *  cuadrícula (método de cuadrícula) de celdas exactas en cm para ampliar. */
export default function ImageNode({
  obj,
  isSelected,
  onSelect,
  onChange,
  snap,
  snapDrag,
  draggable,
  scale = 1,
}: BaseNodeProps & { isSelected: boolean }) {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const ref = useRef<Konva.Group>(null)

  useEffect(() => {
    if (!obj.src) return
    const image = new window.Image()
    image.crossOrigin = 'anonymous'
    image.src = obj.src
    image.onload = () => setImg(image)
  }, [obj.src])

  // Cuadrícula (método de cuadrícula) EXACTA: usa cuadrados perfectos de `gridCm`.
  // La última columna/fila puede ser un corte parcial, como ocurre en la vida real.
  const grid = useMemo(() => {
    if (!obj.gridCm || obj.gridCm <= 0) return null
    const wCm = cmOf(obj.w)
    const hCm = cmOf(obj.h)
    const cols = Math.ceil(wCm / obj.gridCm)
    const rows = Math.ceil(hCm / obj.gridCm)
    
    const cw = obj.gridCm * PX_PER_CM
    const ch = obj.gridCm * PX_PER_CM
    const vx: number[] = []
    const hy: number[] = []
    for (let i = 1; i < cols; i++) vx.push(i * cw)
    for (let j = 1; j < rows; j++) hy.push(j * ch)
    return { cols, rows, cw, ch, vx, hy }
  }, [obj.gridCm, obj.w, obj.h])

  return (
    <Group
      ref={ref}
      name={obj.id}
      x={obj.x}
      y={obj.y}
      rotation={obj.rotation}
      visible={obj.visible !== false}
      draggable={draggable}
      onClick={(e) => onSelect(e.evt.shiftKey)}
      onTap={(e) => onSelect(e.evt.shiftKey)}
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
        const scaleY = node.scaleY()
        node.scaleX(1)
        node.scaleY(1)
        onChange({
          ...obj,
          x: node.x(),
          y: node.y(),
          w: Math.max(20, obj.w * scaleX),
          h: Math.max(20, obj.h * scaleY),
          rotation: node.rotation(),
        })
      }}
    >
      <KonvaImage
        image={img ?? undefined}
        x={0}
        y={0}
        width={obj.w}
        height={obj.h}
        opacity={(obj.opacity ?? 100) / 100}
        shadowColor={isSelected ? '#000' : undefined}
        shadowBlur={isSelected ? 8 : 0}
        shadowOpacity={0.3}
      />
      {grid && (
        <>
          {grid.vx.map((x, i) => (
            <Line key={`v${i}`} points={[x, 0, x, obj.h]} stroke="#ef4444" strokeWidth={1 / scale} opacity={0.7} listening={false} />
          ))}
          {grid.hy.map((y, i) => (
            <Line key={`h${i}`} points={[0, y, obj.w, y]} stroke="#ef4444" strokeWidth={1 / scale} opacity={0.7} listening={false} />
          ))}
          {/* Borde exterior */}
          <Line points={[0, 0, obj.w, 0, obj.w, obj.h, 0, obj.h, 0, 0]} stroke="#ef4444" strokeWidth={1.5 / scale} opacity={0.85} listening={false} />
          {/* Etiquetas dentro de cada celda (A1, B1, etc.) */}
          {grid.cw * scale > 14 &&
            Array.from({ length: grid.cols * grid.rows }).map((_, i) => {
              const c = i % grid.cols
              const r = Math.floor(i / grid.cols)
              const cellW = c === grid.cols - 1 ? obj.w - c * grid.cw : grid.cw
              const cellH = r === grid.rows - 1 ? obj.h - r * grid.ch : grid.ch
              // Ocultar la etiqueta si la celda residual es muy pequeña para albergarla
              if (cellW * scale < 25 || cellH * scale < 14) return null
              return (
                <Text
                  key={`lbl${i}`}
                  x={c * grid.cw}
                  y={r * grid.ch}
                  text={`${colLabel(c)}${r + 1}`}
                  fontSize={10 / scale}
                  fill="#ef4444"
                  opacity={0.8}
                  padding={2 / scale}
                  listening={false}
                />
              )
            })}
        </>
      )}
    </Group>
  )
}
