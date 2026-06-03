import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider';
import { BoardObject } from '@shared/lib/boards/types'
import { cmOf, formatCm, defaultScaler, type Scaler } from '@shared/lib/measure'

const round1 = (n: number) => Math.round(n * 10) / 10
const fmtM = (cm: number) => {
  if (cm < 10) return ''
  const m = cm / 100
  return ` (${Number.isInteger(m) ? m.toString() : m.toFixed(2).replace(/\.?0+$/, '')} m)`
}

/** Cota de tamaño real del objeto seleccionado (Referencia + Final en cuadrícula). */
export default function DimensionLabel({
  o,
  pos,
  scale,
  isGrid,
  scaler = defaultScaler,
}: {
  o: BoardObject
  pos: { x: number; y: number }
  scale: number
  isGrid: boolean
  scaler?: Scaler
}) {
  const { t } = usePreferences()
  const isLin = o.type === 'line' || o.type === 'arrow'
  const wCm = round1(cmOf(o.w))
  const hCm = round1(cmOf(o.h))
  const diagCm = round1(cmOf(Math.hypot(o.w, o.h)))

  const dimStr = (a: number, b: number) => `${a} cm${fmtM(a)} × ${b} cm${fmtM(b)}`
  const label = isLin ? `${diagCm} cm${fmtM(diagCm)}` : dimStr(wCm, hCm)

  const left = pos.x + (o.x + o.w / 2) * scale
  const top = pos.y + (o.y + o.h) * scale + 8

  // Cota doble (Referencia + Final): ambas escalas SIEMPRE visibles en cuadrícula.
  if (isGrid) {
    const sLabelRef = () => (isLin ? formatCm(diagCm) : `${formatCm(wCm)} × ${formatCm(hCm)}`)
    const sLabelFin = () => (isLin ? scaler.formatScaled(diagCm) : `${scaler.formatScaled(wCm)} × ${scaler.formatScaled(hCm)}`)
    return (
      <div className="absolute -translate-x-1/2 rounded bg-[var(--color-primary)] text-[var(--color-on-primary)] font-mono text-[10px] pointer-events-none z-20 whitespace-nowrap overflow-hidden" style={{ left, top }}>
        <div className="px-1.5 py-0.5 opacity-90 border-b border-[var(--color-on-primary)]/20">
          {t('boards.reference')} {sLabelRef()}
        </div>
        <div className="px-1.5 py-0.5">
          {t('boards.final')} {sLabelFin()}
        </div>
      </div>
    )
  }

  return (
    <div className="absolute -translate-x-1/2 px-1.5 py-0.5 rounded bg-[var(--color-primary)] text-[var(--color-on-primary)] font-mono text-[10px] pointer-events-none z-20 whitespace-nowrap" style={{ left, top }}>
      {label}
    </div>
  )
}
