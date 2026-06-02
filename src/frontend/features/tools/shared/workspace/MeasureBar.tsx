'use client'

import type { ReactNode } from 'react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'

/**
 * Pie de medidas unificado: Referencia + Final, mismo estilo en las 3 herramientas.
 * `extra` permite añadir métricas propias (cols×rows, zoom…) a la izquierda.
 * REQUISITO DURO: sin scroll — el contenido envuelve.
 */
export default function MeasureBar({
  referenceLabel,
  finalLabel,
  extra,
}: {
  referenceLabel: string
  finalLabel: string
  extra?: ReactNode
}) {
  const { t } = usePreferences()
  return (
    <div className="bg-[var(--color-surface-container)] border-t border-[var(--color-outline-variant)] shrink-0 px-[var(--spacing-grid-gutter)] py-1.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 font-mono text-[10px] text-[var(--color-on-surface-variant)] min-w-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">{extra}</div>
      <div className="flex items-stretch gap-3 shrink-0">
        <div className="flex flex-col justify-center px-3 py-1 rounded-md bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/60">
          <span className="uppercase tracking-[0.1em] mb-0.5">{t('tools.reference')}</span>
          <span className="text-[var(--color-on-surface)]">{referenceLabel}</span>
        </div>
        <div className="flex flex-col justify-center px-3 py-1 rounded-md bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/40">
          <span className="text-[var(--color-primary)] uppercase tracking-[0.1em] mb-0.5">{t('tools.final')}</span>
          <span className="text-[var(--color-primary)]">{finalLabel}</span>
        </div>
      </div>
    </div>
  )
}
