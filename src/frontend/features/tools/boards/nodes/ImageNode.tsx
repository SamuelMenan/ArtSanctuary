'use client'

import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Image as KonvaImage, Group, Line, Text } from 'react-konva'
import type Konva from 'konva'
import { cmOf, PX_PER_CM } from '@shared/lib/measure'
import { colLabel } from '@frontend/features/tools/grid/lib/colLabel'
import type { BaseNodeProps } from './types'

/**
 * Mip (textura reducida) potencia-de-dos, cacheada. Se construye a la mitad del
 * nivel anterior (downscale 2x escalonado = máxima calidad, sin aliasing). Nivel
 * 1 = imagen original (no se cachea aquí). Cada imagen mantiene su cadena de
 * niveles en un Map hasta que cambia su `src`.
 */
function getMip(
  full: HTMLImageElement,
  cache: Map<number, HTMLCanvasElement>,
  level: number,
): HTMLCanvasElement {
  const existing = cache.get(level)
  if (existing) return existing
  const src: HTMLImageElement | HTMLCanvasElement =
    level === 2 ? full : getMip(full, cache, level / 2)
  const sw = src instanceof HTMLCanvasElement ? src.width : src.naturalWidth
  const sh = src instanceof HTMLCanvasElement ? src.height : src.naturalHeight
  const cw = Math.max(1, Math.round(sw / 2))
  const ch = Math.max(1, Math.round(sh / 2))
  const cv = document.createElement('canvas')
  cv.width = cw
  cv.height = ch
  const c = cv.getContext('2d')
  if (c) {
    c.imageSmoothingEnabled = true
    c.imageSmoothingQuality = 'high'
    c.drawImage(src, 0, 0, cw, ch)
  }
  cache.set(level, cv)
  return cv
}

/** Nodo imagen: gestiona su propio HTMLImageElement. Opcionalmente superpone una
 *  cuadrícula (método de cuadrícula) de celdas exactas en cm para ampliar. */
function ImageNode({
  obj,
  isSelected,
  onSelect,
  onChange,
  readOnly,
  snap,
  snapDrag,
  draggable,
  scale = 1,
}: BaseNodeProps & { isSelected: boolean }) {
  const [img, setImg] = useState<CanvasImageSource | null>(null)
  const ref = useRef<Konva.Group>(null)
  // Imagen original full-res + cadena de mips cacheados por nivel.
  const fullRef = useRef<HTMLImageElement | null>(null)
  const mipsRef = useRef<Map<number, HTMLCanvasElement>>(new Map())
  // Cambia al cargar una nueva fuente: dispara el cálculo de LOD inicial.
  const [gen, setGen] = useState(0)

  // Carga full-res (una vez por src). NO se downscalea la fuente: `obj.src` y la
  // imagen original quedan intactas para el zoom extremo y para export/handoff.
  // El reseteo de textura y la elección de nivel los hace el efecto de LOD.
  useEffect(() => {
    fullRef.current = null
    mipsRef.current = new Map()
    if (!obj.src) return
    let cancelled = false
    const image = new window.Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      if (cancelled) return
      fullRef.current = image
      setGen((g) => g + 1)
    }
    image.src = obj.src
    return () => {
      cancelled = true
    }
  }, [obj.src])

  // LOD (mipmaps) por zoom: elige la resolución de textura según cuántos píxeles
  // ocupa la imagen EN PANTALLA (mundo·zoom·dpr). Si se ve grande (zoom adentro)
  // usa la original → nitidez total en zoom extremo. Si se ve pequeña usa una mip
  // menor → mucho menos costo al panear/alejar, sin diferencia visible (la
  // textura nunca es menor que el tamaño mostrado, así que no hay borrosidad).
  // También resetea la textura (a null) cuando aún no hay imagen cargada.
  useEffect(() => {
    const full = fullRef.current
    const natural = full ? Math.max(full.naturalWidth, full.naturalHeight) : 0
    if (!full || natural === 0) {
      setImg(full)
      return
    }
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
    const onScreen = Math.max(obj.w, obj.h) * scale * dpr
    // Nivel = factor de reducción (potencia de dos). Se baja mientras la mitad
    // siguiente siga cubriendo el tamaño en pantalla y no quede absurdamente
    // chica (≥256 px de lado mayor).
    let level = 1
    while (natural / (level * 2) >= onScreen && natural / (level * 2) >= 256) level *= 2
    setImg(level === 1 ? full : getMip(full, mipsRef.current, level))
  }, [scale, obj.w, obj.h, gen, obj.src])

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
    const baseCols: number[] = []
    for (let c = 0; c < cols; c++) {
      baseCols.push(c === cols - 1 ? obj.w - c * cw : cw)
    }
    const colWidths = obj.flipX ? [...baseCols].reverse() : baseCols
    const colStarts: number[] = []
    let acc = 0
    for (let c = 0; c < colWidths.length; c++) {
      colStarts.push(acc)
      acc += colWidths[c]
    }
    const vx: number[] = []
    const hy: number[] = []
    for (let i = 1; i < cols; i++) vx.push(colStarts[i])
    for (let j = 1; j < rows; j++) hy.push(j * ch)
    return { cols, rows, cw, ch, vx, hy, colStarts, colWidths }
  }, [obj.flipX, obj.gridCm, obj.w, obj.h])

  return (
    <Group
      ref={ref}
      name={obj.id}
      x={obj.x}
      y={obj.y}
      rotation={obj.rotation}
      visible={obj.visible !== false}
      draggable={draggable}
      onClick={(e) => !readOnly && onSelect(obj.id, e.evt.shiftKey)}
      onTap={(e) => !readOnly && onSelect(obj.id, e.evt.shiftKey)}
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
        x={obj.flipX ? obj.w : 0}
        y={0}
        scaleX={obj.flipX ? -1 : 1}
        width={obj.w}
        height={obj.h}
        opacity={(obj.opacity ?? 100) / 100}
        perfectDrawEnabled={false}
        // Énfasis de selección con borde fino (barato) en vez de shadowBlur, que
        // era caro al panear con una imagen grande seleccionada. El Transformer
        // (manijas) ya marca la selección; esto solo refuerza el contorno.
        stroke={isSelected ? '#3b82f6' : undefined}
        strokeWidth={isSelected ? 2 / scale : 0}
        strokeEnabled={isSelected}
        strokeScaleEnabled={false}
      />
      {grid && (
        <>
          {grid.vx.map((x, i) => (
            <Line
              key={`v${i}`}
              points={[x, 0, x, obj.h]}
              stroke="#ef4444"
              strokeWidth={1 / scale}
              opacity={0.7}
              listening={false}
            />
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
              const cellW = grid.colWidths[c]
              const cellH = r === grid.rows - 1 ? obj.h - r * grid.ch : grid.ch
              const cellX = grid.colStarts[c]
              const labelCol = obj.flipX ? grid.cols - 1 - c : c
              // Ocultar la etiqueta si la celda residual es muy pequeña para albergarla
              if (cellW * scale < 25 || cellH * scale < 14) return null
              return (
                <Text
                  key={`lbl${i}`}
                  x={cellX}
                  y={r * grid.ch}
                  text={`${colLabel(labelCol)}${r + 1}`}
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

export default memo(ImageNode)
