"use client"

import Link from 'next/link'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider';

interface Props {
  className?: string
  /** Oculta la etiqueta en pantallas estrechas (header): deja icono + flecha. */
  compact?: boolean
}

/** CTA "UPLOAD WORK": bloque azul con `add` + etiqueta y cuadro negro con flecha. */
export default function UploadButton({ className = '', compact = false }: Props) {
  const { t } = usePreferences();
  return (
    <Link
      href="/upload"
      aria-label={t('home.uploadArtwork')}
      className={`group inline-flex items-stretch h-10 shrink-0 bg-[var(--color-brand)] text-[var(--color-on-brand)] font-sans font-semibold text-[15px] leading-[22.5px] uppercase focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2 ${className}`}
    >
      <span className="flex items-center gap-1.5 pl-4 pr-3.5">
        <span className="material-symbols-outlined" aria-hidden>add</span>
        <span className={`whitespace-nowrap ${compact ? 'hidden xl:inline' : ''}`}>{t('home.uploadArtwork')}</span>
      </span>
      <span className="flex items-center justify-center w-10 shrink-0 bg-[var(--color-ink)] text-[var(--color-on-ink)]">
        <span className="material-symbols-outlined" aria-hidden>north_east</span>
      </span>
    </Link>
  )
}
