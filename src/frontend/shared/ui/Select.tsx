'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { scaleIn, staggerParent, fadeSlide } from '@frontend/shared/motion/tokens'

export interface SelectOption {
  value: string
  label: string
}

/**
 * Select unificado de la app. Dropdown PROPIO (no nativo) para poder animarlo:
 * abre con `scaleIn` y las opciones entran escalonadas. Contraste sólido (fondo
 * `surface-container-high`, texto `on-surface`). `size` sm (barras) / md
 * (paneles). Cierra al hacer clic fuera o con Escape.
 */
export default function Select({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
  size = 'md',
  className = '',
}: {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  /** Opción vacía inicial (p. ej. "Ninguno", "Cargar…"). */
  placeholder?: string
  ariaLabel?: string
  size?: 'sm' | 'md'
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const h = size === 'sm' ? 'h-7' : 'h-9'

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const selected = options.find((o) => o.value === value)
  const label = selected?.label ?? placeholder ?? ''

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={
          `flex w-full ${h} items-center gap-1 rounded-lg border border-[var(--color-outline-variant)] ` +
          'bg-[var(--color-surface-container-high)] pl-2.5 pr-1.5 font-mono text-[11px] text-[var(--color-on-surface)] ' +
          'transition-colors hover:border-[var(--color-outline)] focus:border-[var(--color-primary)] focus:outline-none ' +
          'focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/50'
        }
      >
        <span className="min-w-0 flex-1 truncate text-left">{label}</span>
        <motion.span
          className="material-symbols-outlined shrink-0 text-[16px] text-[var(--color-on-surface-variant)]"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.15 }}
        >
          expand_more
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ transformOrigin: 'top' }}
            className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-64 overflow-y-auto rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-high)] p-1 shadow-xl [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <motion.div variants={staggerParent} initial="initial" animate="animate">
              {placeholder !== undefined && (
                <Option label={placeholder} active={value === ''} onClick={() => { onChange(''); setOpen(false) }} />
              )}
              {options.map((o) => (
                <Option key={o.value} label={o.label} active={o.value === value} onClick={() => { onChange(o.value); setOpen(false) }} />
              ))}
            </motion.div>
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

function Option({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <motion.li variants={fadeSlide} role="option" aria-selected={active}>
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center rounded-md px-2 py-1.5 text-left font-mono text-[11px] transition-colors ${
          active
            ? 'bg-[var(--color-primary)]/12 text-[var(--color-primary)]'
            : 'text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-highest)]'
        }`}
      >
        <span className="truncate">{label}</span>
      </button>
    </motion.li>
  )
}
