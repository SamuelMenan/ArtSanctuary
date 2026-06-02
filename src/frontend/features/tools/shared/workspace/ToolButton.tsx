'use client'

import type { ReactNode } from 'react'

export type ToolButtonVariant = 'ghost' | 'primary' | 'icon' | 'toggle' | 'action'

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg shrink-0 font-mono text-label-sm font-semibold ' +
  'transition-[color,background-color,border-color,box-shadow,opacity] duration-150 ' +
  'disabled:opacity-40 disabled:pointer-events-none ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/60 ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-container)]'

const variants: Record<ToolButtonVariant, string> = {
  ghost:
    'h-10 px-3 border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] ' +
    'hover:text-[var(--color-on-surface)] hover:border-[var(--color-outline)] hover:bg-[var(--color-surface-container-high)]',
  primary:
    'h-10 px-4 bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:opacity-90',
  action:
    'h-10 px-4 bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] border border-transparent hover:bg-[var(--color-surface-bright)]',
  icon:
    'h-10 w-10 px-0 border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] ' +
    'hover:text-[var(--color-on-surface)] hover:border-[var(--color-outline)] hover:bg-[var(--color-surface-container-high)]',
  toggle:
    'h-10 px-3 border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] ' +
    'hover:text-[var(--color-on-surface)] hover:border-[var(--color-outline)]',
}

const toggleActive =
  '!text-[var(--color-primary)] !border-[var(--color-primary)] bg-[var(--color-primary)]/10'

/** Modo apilado (icono sobre etiqueta) para controles segmentados en grid. */
const stackedCls = '!flex-col !gap-1 h-[52px] px-1'

/**
 * Botón unificado de las herramientas de imagen. Una sola fuente de verdad para
 * el estilo (ghost/primary/action/icon/toggle). Los icon-only requieren `title`
 * (se usa como `aria-label`). `stacked` apila icono+etiqueta para controles
 * segmentados (varita/borrar/restaurar) dentro de un ToolGrid.
 */
export default function ToolButton({
  icon,
  label,
  title,
  variant = 'ghost',
  active = false,
  disabled = false,
  stacked = false,
  onClick,
  className = '',
}: {
  icon?: ReactNode
  label?: string
  title?: string
  variant?: ToolButtonVariant
  active?: boolean
  disabled?: boolean
  stacked?: boolean
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
      className={`${base} ${variants[variant]} ${stacked ? stackedCls : ''} ${variant === 'toggle' && active ? toggleActive : ''} ${className}`}
    >
      {typeof icon === 'string' ? (
        <span className={`material-symbols-outlined ${stacked ? 'text-[20px]' : 'text-[18px]'}`}>{icon}</span>
      ) : (
        icon
      )}
      {label && <span className={stacked ? 'text-[9px] tracking-[0.08em] leading-none' : ''}>{label}</span>}
    </button>
  )
}
