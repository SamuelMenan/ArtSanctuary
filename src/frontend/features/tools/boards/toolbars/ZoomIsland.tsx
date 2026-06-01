import { island, islandIdle } from './islandStyles'

/** Isla inferior izquierda: controles de vista (alejar, % / centrar, acercar). */
export default function ZoomIsland({
  scale,
  onZoomIn,
  onZoomOut,
  onReset,
}: {
  scale: number
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
}) {
  return (
    <div className={`${island} left-3 bottom-3 flex items-center gap-0.5 p-1 rounded-full`}>
      <button onClick={onZoomOut} title="Alejar" className={islandIdle}>
        <span className="material-symbols-outlined text-[20px]">remove</span>
      </button>
      <button onClick={onReset} title="Centrar vista" className="font-mono text-[11px] text-[var(--color-on-surface)] px-2 h-10 min-w-[48px] hover:text-[var(--color-primary)] transition-colors">
        {Math.round(scale * 100)}%
      </button>
      <button onClick={onZoomIn} title="Acercar" className={islandIdle}>
        <span className="material-symbols-outlined text-[20px]">add</span>
      </button>
    </div>
  )
}
