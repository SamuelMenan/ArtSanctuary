import Link from 'next/link'
import type { ReactNode } from 'react'

/**
 * Patrón recurrente del diseño: etiqueta en mayúsculas a la izquierda + cuadro
 * negro con flecha `north_east` a la derecha. Presentacional puro (un enlace).
 *
 * `children` puede ser un texto o un bloque (p. ej. título + autor en las cards
 * de obra); el cuadro de flecha siempre ocupa todo el alto.
 */
export const arrowBoxClass =
  'flex items-center justify-center w-12 shrink-0 bg-[var(--color-ink)] text-[var(--color-on-ink)] transition-colors group-hover:bg-[var(--color-brand)]'

export const arrowShellClass =
  'group flex items-stretch justify-between min-h-12 bg-[var(--color-on-ink)] text-[var(--color-ink)] border border-[var(--color-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2'

export const arrowLabelClass =
  'flex items-center min-w-0 px-4 font-sans font-medium text-base leading-6 uppercase'

export function ArrowBox({ icon = 'north_east' }: { icon?: string }) {
  return (
    <span className={arrowBoxClass}>
      <span className="material-symbols-outlined" aria-hidden>{icon}</span>
    </span>
  )
}

export default function ArrowLink({
  href,
  children,
  className = '',
  scroll,
  ariaLabel,
}: {
  href: string
  children?: ReactNode
  className?: string
  scroll?: boolean
  ariaLabel?: string
}) {
  return (
    <Link href={href} scroll={scroll} aria-label={ariaLabel} className={`${arrowShellClass} ${className}`}>
      <span className={arrowLabelClass}>
        <span className="truncate">{children}</span>
      </span>
      <ArrowBox />
    </Link>
  )
}
