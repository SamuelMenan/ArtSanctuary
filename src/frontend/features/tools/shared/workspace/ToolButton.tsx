'use client'

import type { ReactNode } from 'react'

export type ToolButtonVariant = 'ghost' | 'primary' | 'icon' | 'toggle' | 'action'

const base =
  'flex items-center justify-center gap-2 h-10 rounded-lg shrink-0 transition-colors disabled:opacity-40 font-mono text-label-sm font-semibold'

const variants: Record<ToolButtonVariant, string> = {
  ghost:
    'px-3 border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]',
  primary:
    'px-4 bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:opacity-90',
  action:
    'px-4 bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] hover:opacity-90',
  icon:
    'w-10 px-0 border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]',
  toggle:
    'px-3 border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]',
}

const toggleActive =
  '!text-[var(--color-primary)] !border-[var(--color-primary)] bg-[var(--color-primary)]/10'

/**
 * Botón unificado de las herramientas de imagen. Una sola fuente de verdad para
 * el estilo (ghost/primary/action/icon/toggle). Los icon-only requieren `title`
 * (se usa como `aria-label` por accesibilidad).
 */
export default function ToolButton({
  icon,
  label,
  title,
  variant = 'ghost',
  active = false,
  disabled = false,
  onClick,
  className = '',
}: {
  icon?: ReactNode
  label?: string
  title?: string
  variant?: ToolButtonVariant
  active?: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
}) {
  const iconOnly = !label
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={iconOnly ? title : undefined}
      aria-pressed={variant === 'toggle' ? active : undefined}
      className={`${base} ${variants[variant]} ${variant === 'toggle' && active ? toggleActive : ''} ${className}`}
    >
      {typeof icon === 'string' ? (
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      ) : (
        icon
      )}
      {label}
    </button>
  )
}
