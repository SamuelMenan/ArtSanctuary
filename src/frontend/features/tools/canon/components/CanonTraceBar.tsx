'use client'

import { useRef } from 'react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'

const labelCls = 'font-mono text-label-sm text-[var(--color-on-surface-variant)] uppercase tracking-wider whitespace-nowrap'
const btnCls =
  'flex items-center gap-1 px-2 py-1 rounded-[var(--radius-sm)] border font-mono text-label-sm uppercase tracking-wider transition-all'
const offCls = 'border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]'
const onCls = 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/10'

export interface CanonTraceBarProps {
  refUrl: string | null
  refOpacity: number
  onRefFile: (file: File) => void
  onRefOpacity: (v: number) => void
  onClearRef: () => void
  measureActive: boolean
  onToggleMeasure: () => void
  onClearMeasure: () => void
}

/** Barra de calco (imagen de referencia) + regla interactiva. */
export default function CanonTraceBar({
  refUrl,
  refOpacity,
  onRefFile,
  onRefOpacity,
  onClearRef,
  measureActive,
  onToggleMeasure,
  onClearMeasure,
}: CanonTraceBarProps) {
  const { t } = usePreferences()
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-wrap items-center gap-3 px-[var(--spacing-grid-gutter)] py-1.5 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] shrink-0">
      <span className={labelCls}>{t('canon.trace')}</span>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onRefFile(f)
          e.target.value = ''
        }}
      />
      <button type="button" onClick={() => fileRef.current?.click()} className={`${btnCls} ${offCls}`}>
        <span className="material-symbols-outlined text-[18px]">image</span>
        {t('canon.loadReference')}
      </button>

      {refUrl && (
        <div className="flex items-center gap-2">
          <label className={labelCls} htmlFor="ref-opacity">{t('canon.opacity')}</label>
          <input
            id="ref-opacity"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={refOpacity}
            onChange={(e) => onRefOpacity(Number(e.target.value))}
            className="w-28 accent-[var(--color-primary)]"
          />
          <button type="button" onClick={onClearRef} aria-label={t('canon.clearReference')} title={t('canon.clearReference')} className={`${btnCls} ${offCls}`}>
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      <span className="w-px self-stretch bg-[var(--color-outline-variant)]" aria-hidden />

      <button type="button" onClick={onToggleMeasure} aria-pressed={measureActive} className={`${btnCls} ${measureActive ? onCls : offCls}`}>
        <span className="material-symbols-outlined text-[18px]">straighten</span>
        {t('canon.ruler')}
      </button>
      {measureActive && (
        <button type="button" onClick={onClearMeasure} aria-label={t('canon.clearRuler')} title={t('canon.clearRuler')} className={`${btnCls} ${offCls}`}>
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      )}
    </div>
  )
}
