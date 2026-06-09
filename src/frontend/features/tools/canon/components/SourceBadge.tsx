'use client'

import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import type { FactSource } from '@shared/lib/canon/anatomyFacts'

/** Badge discreto de procedencia (Vitruvio/Richer/Loomis/Bridgman/Antropometría). */
export default function SourceBadge({ source }: { source: FactSource }) {
  const { t } = usePreferences()
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-outline-variant)]/70 px-1.5 py-px font-mono text-[9px] uppercase tracking-wider text-[var(--color-on-surface-variant)]">
      <span className="material-symbols-outlined text-[11px] leading-none">menu_book</span>
      {t(`canon.help.sources.${source}`)}
    </span>
  )
}
