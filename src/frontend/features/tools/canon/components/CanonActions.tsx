'use client'

import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import type { CanonOption } from './CanonToolbar'

const fieldCls =
  'bg-[var(--color-surface-dim)] border border-[var(--color-outline-variant)] rounded-[var(--radius-sm)] px-2 py-1 text-[var(--color-primary)] font-mono text-label-sm focus:ring-0 focus:border-[var(--color-primary)] cursor-pointer'
const labelCls = 'font-mono text-label-sm text-[var(--color-on-surface-variant)] uppercase tracking-wider whitespace-nowrap'
const btnCls =
  'px-4 py-2 border border-[var(--color-outline-variant)] rounded-[var(--radius-sm)] font-mono text-label-sm text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all uppercase tracking-wider bg-transparent flex items-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-progress'

export interface CanonActionsProps {
  ghostCanonId: string | null
  onGhost: (id: string | null) => void
  ghostCanons: CanonOption[]
  onSendToBoard: () => void
  compare: boolean
  onToggleCompare: () => void
  exporting: null | 'png' | 'pdf' | 'scale'
  onExport: (kind: 'png' | 'pdf' | 'scale') => void
}

/** Acciones de la barra: superponer (ghost), enviar a tablero, comparar y
 *  exports (PNG / PDF / 1:1). Extraído de `CanonToolbar` por límite de líneas. */
export default function CanonActions({
  ghostCanonId,
  onGhost,
  ghostCanons,
  onSendToBoard,
  compare,
  onToggleCompare,
  exporting,
  onExport,
}: CanonActionsProps) {
  const { t } = usePreferences()
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        <label className={labelCls} htmlFor="ghost-select">{t('canon.superimpose')}</label>
        <select id="ghost-select" value={ghostCanonId ?? ''} onChange={(e) => onGhost(e.target.value || null)} className={fieldCls}>
          <option value="">{t('canon.none')}</option>
          {ghostCanons.map((c) => (
            <option key={c.id} value={c.id}>{t(`canon.names.${c.id}`)}</option>
          ))}
        </select>
      </div>
      <button type="button" onClick={onSendToBoard} className={btnCls}>
        <span className="material-symbols-outlined text-[20px]">add_to_photos</span>
        {t('canon.sendToBoard')}
      </button>
      <button
        type="button"
        onClick={onToggleCompare}
        aria-pressed={compare}
        className={`${btnCls} ${compare ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : ''}`}
      >
        <span className="material-symbols-outlined text-[20px]">{compare ? 'close_fullscreen' : 'compare'}</span>
        {t('canon.compare')}
      </button>
      <button type="button" onClick={() => onExport('png')} disabled={exporting !== null} className={btnCls}>
        <span className="material-symbols-outlined text-[20px]">{exporting === 'png' ? 'hourglass_top' : 'image'}</span>
        {t('canon.exportPng')}
      </button>
      <button type="button" onClick={() => onExport('pdf')} disabled={exporting !== null} className={btnCls}>
        <span className="material-symbols-outlined text-[20px]">{exporting === 'pdf' ? 'hourglass_top' : 'picture_as_pdf'}</span>
        {t('canon.exportPdf')}
      </button>
      <button type="button" onClick={() => onExport('scale')} disabled={exporting !== null} className={btnCls}>
        <span className="material-symbols-outlined text-[20px]">{exporting === 'scale' ? 'hourglass_top' : 'straighten'}</span>
        {t('canon.exportScale')}
      </button>
    </div>
  )
}
