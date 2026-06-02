'use client'

import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'

/** Estado vacío unificado del lienzo: tarjeta-acción punteada + icono + prompt. */
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
      className="group absolute inset-0 flex items-center justify-center focus-visible:outline-none"
    >
      <span className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-[var(--color-outline-variant)] bg-[var(--color-surface-container)]/30 px-12 py-10 text-[var(--color-on-surface-variant)] transition-colors duration-150 group-hover:border-[var(--color-primary)] group-hover:text-[var(--color-primary)] group-focus-visible:border-[var(--color-primary)]">
        <span className="material-symbols-outlined text-5xl">{icon}</span>
        <span className="font-mono text-label-sm uppercase tracking-widest">{prompt ?? t('tools.uploadPrompt')}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] opacity-50">PNG · JPG · WEBP</span>
      </span>
    </button>
  )
}
