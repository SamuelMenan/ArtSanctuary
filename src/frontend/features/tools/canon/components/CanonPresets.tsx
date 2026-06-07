'use client'

import { useState } from 'react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import type { CanonPreset } from '../lib/presets'

const fieldCls =
  'bg-[var(--color-surface-dim)] border border-[var(--color-outline-variant)] rounded-[var(--radius-sm)] px-2 py-1 text-[var(--color-primary)] font-mono text-label-sm focus:ring-0 focus:border-[var(--color-primary)]'
const labelCls = 'font-mono text-label-sm text-[var(--color-on-surface-variant)] uppercase tracking-wider whitespace-nowrap'
const iconBtnCls =
  'p-1 rounded-[var(--radius-sm)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all disabled:opacity-40 disabled:hover:text-[var(--color-on-surface-variant)] disabled:hover:border-[var(--color-outline-variant)]'
const ICON_DELETE = 'delete'
const ICON_SAVE = 'bookmark_add'

export interface CanonPresetsProps {
  presets: CanonPreset[]
  selectedId: string
  onLoad: (id: string) => void
  onSave: (name: string) => void
  onDelete: (id: string) => void
}

/** Barra de presets: cargar / guardar / borrar configuraciones del Canon. */
export default function CanonPresets({ presets, selectedId, onLoad, onSave, onDelete }: CanonPresetsProps) {
  const { t } = usePreferences()
  const [name, setName] = useState('')

  const save = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onSave(trimmed)
    setName('')
  }

  return (
    <div className="flex flex-wrap items-center gap-3 px-[var(--spacing-grid-gutter)] py-1.5 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] shrink-0">
      <span className={labelCls}>{t('canon.presets')}</span>

      {/* Cargar / borrar */}
      <div className="flex items-center gap-1">
        <select
          aria-label={t('canon.presets')}
          value={selectedId}
          onChange={(e) => onLoad(e.target.value)}
          className={`${fieldCls} cursor-pointer`}
        >
          <option value="">{presets.length ? t('canon.selectPreset') : t('canon.noPresets')}</option>
          {presets.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => selectedId && onDelete(selectedId)}
          disabled={!selectedId}
          aria-label={t('canon.deletePreset')}
          title={t('canon.deletePreset')}
          className={iconBtnCls}
        >
          <span className="material-symbols-outlined text-[18px] block">{ICON_DELETE}</span>
        </button>
      </div>

      {/* Guardar nuevo */}
      <div className="flex items-center gap-1">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          placeholder={t('canon.presetName')}
          className={`${fieldCls} w-36 placeholder:text-[var(--color-on-surface-variant)]/50`}
        />
        <button
          type="button"
          onClick={save}
          disabled={!name.trim()}
          aria-label={t('canon.savePreset')}
          title={t('canon.savePreset')}
          className={iconBtnCls}
        >
          <span className="material-symbols-outlined text-[18px] block">{ICON_SAVE}</span>
        </button>
      </div>
    </div>
  )
}
