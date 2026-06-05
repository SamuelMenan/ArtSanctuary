'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { appBarIconBtnActive, appBarIconBtnIdle } from './appBarStyles'

/**
 * Botón-icono primitivo de las barras superiores (chrome). Unifica forma,
 * tamaño, icono (20px), hover y foco. Si recibe `href` renderiza un `next/link`;
 * si no, un `button`. `label` (aria) obligatorio; el glifo va `aria-hidden`.
 *
 * No confundir con `boards/toolbars/IconButton` (islas flotantes sobre lienzo):
 * contexto distinto (chrome vs glass), por eso son primitivos separados.
 */
export default function AppBarButton({
  icon,
  label,
  onClick,
  href,
  active,
  disabled,
  pressed,
  title,
  badge,
}: {
  /** Glifo material-symbols. */
  icon: string
  /** Texto accesible (aria-label) + tooltip por defecto. SIEMPRE i18n. */
  label: string
  onClick?: () => void
  /** Si se pasa, renderiza un Link en vez de button. */
  href?: string
  active?: boolean
  disabled?: boolean
  pressed?: boolean
  title?: string
  /** Indicador opcional (p. ej. punto de notificaciones). */
  badge?: ReactNode
}) {
  const cls = `relative ${active ? appBarIconBtnActive(true) : appBarIconBtnIdle}`
  const glyph = (
    <>
      <span className="material-symbols-outlined text-[20px]" aria-hidden>
        {icon}
      </span>
      {badge}
    </>
  )

  if (href) {
    return (
      <Link href={href} title={title ?? label} aria-label={label} className={cls}>
        {glyph}
      </Link>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title ?? label}
      aria-label={label}
      aria-pressed={pressed}
      className={cls}
    >
      {glyph}
    </button>
  )
}
