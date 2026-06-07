import { Layer, Shape } from 'react-konva'
import type Konva from 'konva'
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
 *
 * AUTO-DIRIGIDA: el `sceneFunc` lee el transform VIVO del Stage (posición, zoom,
 * tamaño) y calcula el viewport en el momento de dibujar. Así sigue al paneo
 * imperativo (mover Stage + `batchDraw`, sin re-render) y cubre exactamente lo
 * visible sin importar cuánto se panee. Un solo `Shape` (todas las líneas en un
 * path) en vez de cientos de `<Line>`.
 */
export default function CarnavalHybridGrid({
  rule,
  view,
  baseOffset,
  target = 2,
}: {
  rule: CarnavalRule
  view: CarnavalPlano
  baseOffset: Offset
  target?: number
}) {
  // Independiente del viewport (depende de regla/vista/target): se calcula fuera.
  const ref = buildHybridGrid(rule, view, target)
  const ox = pxOf(baseOffset.x)
  const oy = pxOf(baseOffset.y)

  const draw = (ctx: Konva.Context, shape: Konva.Shape) => {
    const stage = shape.getStage()
    if (!stage) return
    const scale = stage.scaleX()
    // Culling por densidad: si el paso se ve < 4 px, no dibujar (igual que antes).
    if (pxOf(target) * scale < 4) return
    const px = stage.x()
    const py = stage.y()
    const sw = stage.width()
    const sh = stage.height()
    if (sw === 0) return

    // Viewport en cm de mundo, llevado al espacio local del grupo (resta offset).
    const leftCm = cmOf(-px / scale) - baseOffset.x
    const rightCm = cmOf((sw - px) / scale) - baseOffset.x
    const topCm = cmOf(-py / scale) - baseOffset.y
    const bottomCm = cmOf((sh - py) / scale) - baseOffset.y

    const xs = extendLines(ref.x, target, leftCm, rightCm)
    const ys = extendLines(ref.y, target, topCm, bottomCm)

    const yTop = pxOf(topCm) + oy
    const yBot = pxOf(bottomCm) + oy
    const xL = pxOf(leftCm) + ox
    const xR = pxOf(rightCm) + ox

    ctx.beginPath()
    for (const vx of xs) {
      const x = pxOf(vx) + ox
      ctx.moveTo(x, yTop)
      ctx.lineTo(x, yBot)
    }
    for (const vy of ys) {
      const y = pxOf(vy) + oy
      ctx.moveTo(xL, y)
      ctx.lineTo(xR, y)
    }
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 0.6 / scale
    ctx.globalAlpha = 0.3
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  return (
    <Layer listening={false}>
      <Shape sceneFunc={draw} listening={false} perfectDrawEnabled={false} />
    </Layer>
  )
}
