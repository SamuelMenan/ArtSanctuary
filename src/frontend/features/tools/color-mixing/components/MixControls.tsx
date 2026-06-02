'use client'

import { MEDIUMS, type Medium } from '@shared/lib/mediums'
import type { MixLabels } from '../colorMixHelpers'

interface MixControlsProps {
  L: MixLabels
  locale: string
  mediumId: string
  medium: Medium
  slotsCount: number
  changeMedium: (id: string) => void
  clearAll: () => void
}

export default function MixControls({
  L,
  locale,
  mediumId,
  medium,
  slotsCount,
  changeMedium,
  clearAll,
}: MixControlsProps) {
  return (
    <div className="h-16 bg-[var(--color-surface-container)] border-b border-[var(--color-outline-variant)] flex items-center px-4 z-40 shrink-0 overflow-x-auto gap-4">
      <span className="font-mono text-label-sm text-[var(--color-secondary)] uppercase tracking-widest whitespace-nowrap">
        {L.medium}
      </span>
      <select
        value={mediumId}
        onChange={(e) => changeMedium(e.target.value)}
        className="bg-[var(--color-surface-container-high)] border border-[var(--color-outline)] rounded px-3 py-1.5 font-mono text-label-sm uppercase tracking-widest text-[var(--color-on-surface)] hover:border-[var(--color-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
      >
        {MEDIUMS.map((m) => (
          <option key={m.id} value={m.id}>
            {locale === 'es' ? m.nameEs : m.nameEn}
          </option>
        ))}
      </select>

      <div className="w-px h-6 bg-[var(--color-outline-variant)]" />

      <span className="font-mono text-[10px] text-[var(--color-on-surface-variant)] uppercase tracking-widest">
        {medium.model}
      </span>

      <div className="ml-auto flex gap-2">
        <button
          type="button"
          onClick={clearAll}
          disabled={slotsCount === 0}
          className="font-mono text-label-sm uppercase tracking-widest px-3 py-1.5 border border-[var(--color-outline)] rounded text-[var(--color-on-surface-variant)] hover:border-[var(--color-error)] hover:text-[var(--color-error)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {L.clear}
        </button>
      </div>
    </div>
  )
}
