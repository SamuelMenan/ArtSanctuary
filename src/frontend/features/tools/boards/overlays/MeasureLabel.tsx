import { cmOf, formatCm, formatScaled } from '@shared/lib/measure'

export interface MeasureSegment {
  ax: number
  ay: number
  bx: number
  by: number
}

const round1 = (n: number) => Math.round(n * 10) / 10
const fmtM = (cm: number) => {
  if (cm < 10) return ''
  const m = cm / 100
  return ` (${Number.isInteger(m) ? m.toString() : m.toFixed(2).replace(/\.?0+$/, '')} m)`
}

/** Etiqueta flotante con la distancia de la regla (Referencia + Final en cuadrícula). */
export default function MeasureLabel({
  measure,
  pos,
  scale,
  isGrid,
}: {
  measure: MeasureSegment
  pos: { x: number; y: number }
  scale: number
  isGrid: boolean
}) {
  const distCm = round1(cmOf(Math.hypot(measure.bx - measure.ax, measure.by - measure.ay)))
  const mx = pos.x + ((measure.ax + measure.bx) / 2) * scale
  const my = pos.y + ((measure.ay + measure.by) / 2) * scale

  // Mostrar ambas escalas (Referencia + Final).
  if (isGrid) {
    return (
      <div className="absolute -translate-x-1/2 -translate-y-1/2 rounded bg-rose-500 text-white font-mono text-[11px] pointer-events-none z-20 whitespace-nowrap overflow-hidden shadow text-center" style={{ left: mx, top: my }}>
        <div className="px-2 py-0.5 opacity-90 border-b border-white/25">
          Referencia: {formatCm(distCm)}
        </div>
        <div className="px-2 py-0.5">
          Final: {formatScaled(distCm)}
        </div>
      </div>
    )
  }
  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-rose-500 text-white font-mono text-[11px] pointer-events-none z-20 whitespace-nowrap shadow" style={{ left: mx, top: my }}>
      {distCm} cm{fmtM(distCm)}
    </div>
  )
}
