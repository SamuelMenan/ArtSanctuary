'use client'

import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { CANON_NOTES, CROSS_RULES } from '@shared/lib/canon/anatomyFacts'
import SourceBadge from './SourceBadge'

/**
 * Ficha de aprendizaje del canon activo (plan §9.3): qué es el canon + reglas
 * cruzadas confirmadas, cada una con su procedencia. Flota en el stage cuando el
 * modo "Anatomía explicada" está activo. Tokens compartidos; no scrollea la
 * página (su propio overflow interno).
 */
export default function CanonLearnCard({ canonId, onClose }: { canonId: string; onClose: () => void }) {
  const { t } = usePreferences()
  const note = CANON_NOTES[canonId]

  return (
    <div className="absolute right-3 top-3 z-20 flex max-h-[calc(100%-1.5rem)] w-72 flex-col overflow-hidden rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-container)]/95 shadow-2xl backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--color-outline-variant)]/60 px-3 py-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-primary)]">{t('canon.help.learn')}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('canon.help.mode')}
          className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]"
        >
          <span className="material-symbols-outlined text-[18px] leading-none">close</span>
        </button>
      </div>
      <div className="flex flex-col gap-3 overflow-y-auto p-3">
        {note && (
          <div className="flex flex-col gap-1.5">
            <p className="font-sans text-[12px] leading-snug text-[var(--color-on-surface)]">{t(`canon.help.note.${canonId}`)}</p>
            <SourceBadge source={note.source} />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-on-surface-variant)]/70">{t('canon.help.crossRules')}</span>
          {CROSS_RULES.map((r) => (
            <div key={r.key} className="flex flex-col gap-1 border-l-2 border-[var(--color-primary)]/40 pl-2">
              <p className="font-sans text-[11px] leading-snug text-[var(--color-on-surface-variant)]">{t(`canon.help.rule.${r.key}`)}</p>
              <SourceBadge source={r.source} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
