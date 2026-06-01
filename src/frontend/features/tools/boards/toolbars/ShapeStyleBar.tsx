import { BoardObject } from '@shared/lib/boards/types'

/** Barra de estilo para figuras: relleno, borde y grosor. */
export default function ShapeStyleBar({
  o,
  patch,
}: {
  o: BoardObject
  patch: (p: Partial<BoardObject>) => void
}) {
  const hasFill = o.type === 'rect' || o.type === 'ellipse'
  const filled = !!o.fill && o.fill !== 'transparent'
  const swatch =
    'w-9 h-9 rounded-md border border-[var(--color-outline-variant)] hover:border-[var(--color-primary)] transition-colors relative overflow-hidden shrink-0'
  const tog =
    'flex items-center justify-center w-9 h-9 rounded-md border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors shrink-0'
  return (
    <div className="bg-[var(--color-surface-container-low)] border-b border-[var(--color-outline-variant)] shrink-0 px-4 py-2 flex items-center gap-2 overflow-x-auto whitespace-nowrap animate-in fade-in slide-in-from-top-2 duration-200">
      {hasFill && (
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-on-surface-variant)]">Relleno</span>
          {/* Toggle: vacío ↔ relleno */}
          <button
            onClick={() => patch({ fill: filled ? 'transparent' : o.stroke || '#60a5fa' })}
            className={`flex items-center justify-center w-9 h-9 rounded-md border transition-colors shrink-0 ${
              filled
                ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] border-[var(--color-primary)]'
                : 'border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]'
            }`}
            title={filled ? 'Quitar relleno' : 'Rellenar'}
          >
            <span className="material-symbols-outlined text-[18px]">{filled ? 'format_color_fill' : 'format_color_reset'}</span>
          </button>
          {/* Swatch (solo si está relleno) */}
          {filled && (
            <span className={swatch} style={{ background: o.fill }}>
              <input type="color" value={o.fill || '#60a5fa'} onChange={(e) => patch({ fill: e.target.value })} className="absolute inset-[-8px] w-16 h-16 cursor-pointer opacity-0" />
            </span>
          )}
          <span className="w-px h-6 bg-[var(--color-outline-variant)]/60 shrink-0" />
        </div>
      )}

      <label className="flex items-center gap-2 shrink-0">
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-on-surface-variant)]">Borde</span>
        <span className={swatch} style={{ background: o.stroke || '#1e293b' }}>
          <input type="color" value={o.stroke || '#1e293b'} onChange={(e) => patch({ stroke: e.target.value })} className="absolute inset-[-8px] w-16 h-16 cursor-pointer opacity-0" />
        </span>
      </label>

      <span className="w-px h-6 bg-[var(--color-outline-variant)]/60 shrink-0" />

      <div className="flex items-center gap-1 shrink-0">
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-on-surface-variant)]">Grosor</span>
        <button onClick={() => patch({ strokeWidth: Math.max(0, (o.strokeWidth ?? 2) - 1) })} className={tog} title="Menos">
          <span className="material-symbols-outlined text-[18px]">remove</span>
        </button>
        <input
          type="number"
          min={0}
          max={60}
          value={o.strokeWidth ?? 2}
          onChange={(e) => patch({ strokeWidth: Math.max(0, Math.min(60, Number(e.target.value) || 0)) })}
          className="w-14 h-9 bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] rounded-md px-2 font-mono text-sm text-center text-[var(--color-on-surface)] outline-none focus:border-[var(--color-primary)]"
        />
        <button onClick={() => patch({ strokeWidth: Math.min(60, (o.strokeWidth ?? 2) + 1) })} className={tog} title="Más">
          <span className="material-symbols-outlined text-[18px]">add</span>
        </button>
      </div>
    </div>
  )
}
