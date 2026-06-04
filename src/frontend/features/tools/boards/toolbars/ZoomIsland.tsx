import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { island, islandIdle } from './islandStyles'

/** Isla inferior izquierda: controles de vista (alejar, % / centrar, acercar). */
export default function ZoomIsland({
  scale,
  onZoomIn,
  onZoomOut,
  onReset,
  onZoomToFit,
}: {
  scale: number
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  onZoomToFit: () => void
}) {
  const { t } = usePreferences()
  return (
    <div className={`${island} left-3 bottom-3 flex items-center gap-0.5 p-1 rounded-full`} role="group" aria-label={t('boards.zoomGroup')}>
      <button onClick={onZoomOut} title={t('boards.minusTip')} aria-label={t('boards.minusTip')} className={islandIdle}>
        <span className="material-symbols-outlined text-[20px]" aria-hidden>remove</span>
      </button>
      <button onClick={onReset} title={t('boards.resetZoom')} aria-label={t('boards.resetZoom')} className="font-mono text-[11px] text-[var(--color-on-surface)] px-2 h-10 min-w-[48px] hover:text-[var(--color-primary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-lg">
        {Math.round(scale * 100)}%
      </button>
      <button onClick={onZoomIn} title={t('boards.plusTip')} aria-label={t('boards.plusTip')} className={islandIdle}>
        <span className="material-symbols-outlined text-[20px]" aria-hidden>add</span>
      </button>
      <button onClick={onZoomToFit} title={t('boards.fitTip')} aria-label={t('boards.fitTip')} className={islandIdle}>
        <span className="material-symbols-outlined text-[20px]" aria-hidden>fit_screen</span>
      </button>
    </div>
  )
}
