import { Layer, Line } from 'react-konva'
import type { GridLines } from '../lib/grid'

/** Capa de fondo: cuadrícula milimetrada (líneas menores + mayores). */
export default function GridLayer({
  lines,
  color,
  scale,
  opacity,
}: {
  lines: GridLines
  color: string
  scale: number
  /** Opacidad del fondo en 0–100. */
  opacity: number
}) {
  return (
    <Layer listening={false}>
      {lines.minor.map((l) => (
        <Line key={`mi${l.key}`} points={l.points} stroke={color} strokeWidth={1 / scale} opacity={(opacity / 100) * 0.45} />
      ))}
      {lines.major.map((l) => (
        <Line key={`ma${l.key}`} points={l.points} stroke={color} strokeWidth={1.25 / scale} opacity={opacity / 100} />
      ))}
    </Layer>
  )
}
