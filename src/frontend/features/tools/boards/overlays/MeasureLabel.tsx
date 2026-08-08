import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider';
import { cmOf, formatCm, defaultScaler, type Scaler } from '@shared/lib/measure'

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

/** HUD de cabecera flotante y translúcido con la distancia de la regla.
 * Se posiciona de forma fija en el centro superior del escenario para no tapar los dibujos. */
export default function MeasureLabel({
  measure,
  isGrid,
  scaler = defaultScaler,
}: {
  measure: MeasureSegment
  pos?: { x: number; y: number }
  scale?: number
  isGrid: boolean
  scaler?: Scaler
}) {
  const { t } = usePreferences()
  const distCm = round1(cmOf(Math.hypot(measure.bx - measure.ax, measure.by - measure.ay)))

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-neutral-950/80 border border-white/10 text-white font-mono text-[12px] pointer-events-none z-20 shadow-lg backdrop-blur-md flex items-center gap-2">
      <span className="material-symbols-outlined text-[16px] text-rose-500 select-none">straighten</span>
      {isGrid ? (
        <div className="flex items-center gap-2">
          <span>{t('boards.reference')}: <strong className="text-rose-400 font-semibold">{formatCm(distCm)}</strong></span>
          <span className="w-px h-3 bg-white/20" />
          <span>{t('boards.final')}: <strong className="text-rose-400 font-semibold">{scaler.formatScaled(distCm)}</strong></span>
        </div>
      ) : (
        <span>{distCm} cm{fmtM(distCm)}</span>
      )}
    </div>
  )
}
