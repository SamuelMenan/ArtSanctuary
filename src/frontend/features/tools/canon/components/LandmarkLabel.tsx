'use client'

import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { LANDMARK_FACTS } from '@shared/lib/canon/anatomyFacts'
import type { Landmark } from '@shared/lib/canon/landmarks'
import SourceBadge from './SourceBadge'

/**
 * Etiqueta de landmark interactiva (Capa Anatomía). Muestra nombre + valor; al
 * hover/foco despliega un popover con el hecho anatómico CONFIRMADO (qué es, a
 * qué altura cae) y su procedencia (plan §9.1). Sin hecho → etiqueta estática.
 */
export default function LandmarkLabel({
  lm,
  align,
  valueText,
  top,
}: {
  lm: Landmark
  align: 'left' | 'right'
  valueText: string
  top: number
}) {
  const { t } = usePreferences()
  const fact = LANDMARK_FACTS[lm.key]
  const right = align === 'right'

  const content = (
    <>
      <span className="font-mono text-[10px] sm:text-label-sm uppercase tracking-wider text-[var(--color-on-surface)] leading-tight">
        {t(`canon.landmarks.${lm.key}`)}
      </span>
      <span className="font-mono text-[9px] sm:text-[11px] text-[var(--color-primary)] leading-tight">{valueText}</span>
    </>
  )

  const wrapCls = `group absolute ${right ? 'right-0 items-end text-right' : 'left-0 items-start text-left'} flex flex-col -translate-y-1/2`

  if (!fact) {
    return (
      <div className={wrapCls} style={{ top: `${top}%` }}>
        {content}
      </div>
    )
  }

  return (
    <div className={wrapCls} style={{ top: `${top}%` }}>
      <button
        type="button"
        className={`flex flex-col ${right ? 'items-end' : 'items-start'} cursor-help rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/60`}
        aria-label={t(`canon.help.landmark.${lm.key}`)}
      >
        {content}
      </button>
      {/* Popover: aparece al hover/foco. Abre hacia el centro (figura). */}
      <div
        role="tooltip"
        className={`pointer-events-none absolute top-full z-30 mt-1 w-52 origin-top scale-95 opacity-0 rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-high)] p-2.5 shadow-xl transition-[opacity,transform] duration-150 group-hover:scale-100 group-hover:opacity-100 group-focus-within:scale-100 group-focus-within:opacity-100 ${right ? 'right-0' : 'left-0'}`}
      >
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-primary)]">{t(`canon.landmarks.${lm.key}`)}</span>
          {fact.headsCanon !== undefined && (
            <span className="font-mono text-[9px] text-[var(--color-on-surface-variant)]">{t('canon.help.heads', { n: fact.headsCanon })}</span>
          )}
        </div>
        <p className="mb-2 text-left font-sans text-[11px] leading-snug text-[var(--color-on-surface-variant)]">{t(`canon.help.landmark.${lm.key}`)}</p>
        <SourceBadge source={fact.source} />
      </div>
    </div>
  )
}
