import { Layer, Line } from 'react-konva'
import { pxOf, cmOf } from '@shared/lib/measure'
import type { CarnavalRule, CarnavalPlano } from '@shared/lib/workspaces/carnaval'
import { buildHybridGrid } from '../lib/carnavalGuide'

type Offset = { x: number; y: number }

const round3 = (v: number) => Math.round(v * 1000) / 1000

/**
 * Extiende las líneas de referencia (cm) a todo el rango [lo,hi] con paso `step`:
 * dentro de la referencia caen en los bordes exactos; fuera continúan a ~`step`.
 */
function extendLines(lines: number[], step: number, lo: number, hi: number): number[] {
  if (!lines.length) return []
  const out = lines.filter((v) => v >= lo && v <= hi)
  for (let v = lines[0] - step; v >= lo; v -= step) out.push(v)
  for (let v = lines[lines.length - 1] + step; v <= hi; v += step) out.push(v)
  return [...new Set(out.map(round3))].sort((a, b) => a - b)
}

/**
 * Grid híbrido alineado a la referencia (carroza / carro alegórico) que cubre
 * TODO el tablero: bandas exactas en los bordes de la guía + continuación
 * uniforme (~target cm) hacia afuera hasta el viewport.
 */
export default function CarnavalHybridGrid({
  rule,
  view,
  scale,
  pos,
  stageSize,
  baseOffset,
  target = 2,
}: {
  rule: CarnavalRule
  view: CarnavalPlano
  scale: number
  pos: { x: number; y: number }
  stageSize: { w: number; h: number }
  baseOffset: Offset
  target?: number
}) {
  if (pxOf(target) * scale < 4 || stageSize.w === 0) return null

  const ref = buildHybridGrid(rule, view, target)

  // Viewport en cm de mundo, llevado al espacio local del grupo (resta offset).
  const leftCm = cmOf(-pos.x / scale) - baseOffset.x
  const rightCm = cmOf((stageSize.w - pos.x) / scale) - baseOffset.x
  const topCm = cmOf(-pos.y / scale) - baseOffset.y
  const bottomCm = cmOf((stageSize.h - pos.y) / scale) - baseOffset.y

  const xs = extendLines(ref.x, target, leftCm, rightCm)
  const ys = extendLines(ref.y, target, topCm, bottomCm)

  const ox = pxOf(baseOffset.x)
  const oy = pxOf(baseOffset.y)
  const sw = 0.6 / scale
  const yTop = pxOf(topCm) + oy
  const yBot = pxOf(bottomCm) + oy
  const xL = pxOf(leftCm) + ox
  const xR = pxOf(rightCm) + ox

  return (
    <Layer listening={false}>
      {xs.map((vx, i) => (
        <Line key={`v${i}`} points={[pxOf(vx) + ox, yTop, pxOf(vx) + ox, yBot]} stroke="#94a3b8" strokeWidth={sw} opacity={0.3} listening={false} />
      ))}
      {ys.map((vy, i) => (
        <Line key={`h${i}`} points={[xL, pxOf(vy) + oy, xR, pxOf(vy) + oy]} stroke="#94a3b8" strokeWidth={sw} opacity={0.3} listening={false} />
      ))}
    </Layer>
  )
}
