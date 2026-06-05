import { Layer, Rect, Text, Line } from 'react-konva'
import { cmOf } from '@shared/lib/measure'
import { objectsBBoxPx } from '../lib/carnavalInspect'
import type { BoardObject } from '@shared/lib/boards/types'

const round1 = (n: number) => Math.round(n * 10) / 10
const ACCENT = '#2563eb' // azul: lo que el inspector está midiendo

/**
 * Dibuja la envolvente que el Inspector mide (mismos objetos: shapes/imágenes,
 * sin texto/stickies ni figura humana). Hace visible el "qué se mide" para que
 * el usuario entienda por qué una medida no coincide con un objeto individual.
 * Solo se monta con el Inspector abierto.
 */
export default function CarnavalMeasuredBBox({
  objects,
  scale,
}: {
  objects: BoardObject[]
  scale: number
}) {
  const px = objectsBBoxPx(objects)
  if (!px) return null

  const sw = (n: number) => n / scale
  const labelSize = 11 / scale
  const wCm = round1(cmOf(px.w))
  const hCm = round1(cmOf(px.h))

  return (
    <Layer listening={false}>
      <Rect
        x={px.x}
        y={px.y}
        width={px.w}
        height={px.h}
        stroke={ACCENT}
        strokeWidth={sw(1.5)}
        dash={[sw(8), sw(6)]}
      />
      {/* Ancho medido */}
      <Text
        x={px.x}
        y={px.y + px.h + labelSize * 0.4}
        text={`envolvente · ancho ${wCm} cm boceto`}
        fontSize={labelSize}
        fontFamily="monospace"
        fill={ACCENT}
      />
      {/* Alto medido */}
      <Text
        x={px.x + px.w + labelSize * 0.4}
        y={px.y}
        text={`alto ${hCm} cm boceto`}
        fontSize={labelSize}
        fontFamily="monospace"
        fill={ACCENT}
      />
    </Layer>
  )
}
