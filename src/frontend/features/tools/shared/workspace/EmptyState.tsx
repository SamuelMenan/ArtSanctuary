'use client'

import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'

/** Estado vacío unificado del lienzo: icono-acción + prompt. */
export default function EmptyState({
  icon = 'add_photo_alternate',
  prompt,
  onClick,
}: {
  icon?: string
  prompt?: string
  onClick: () => void
}) {
  const { t } = usePreferences()
  return (
    <button
      onClick={onClick}
      className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors"
    >
      <span className="material-symbols-outlined text-5xl">{icon}</span>
      <span className="font-mono text-label-sm uppercase tracking-widest">{prompt ?? t('tools.uploadPrompt')}</span>
    </button>
  )
}
