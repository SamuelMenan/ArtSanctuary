'use client'

import { useEffect, useRef } from 'react'

export interface ContextMenuItem {
  label: string
  icon: string
  onClick: () => void
  danger?: boolean
  disabled?: boolean
}

/**
 * Menú contextual (clic derecho) del lienzo, estilo Figma/Miro. Se cierra al
 * hacer clic fuera o pulsar Escape; navegable por teclado.
 */
export default function ContextMenu({
  x,
  y,
  items,
  onClose,
}: {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    ref.current?.querySelector('button')?.focus()
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      role="menu"
      style={{ left: x, top: y }}
      className="absolute z-40 min-w-[180px] py-1 rounded-xl bg-[var(--color-surface-container)]/95 backdrop-blur-md border border-[var(--color-outline-variant)] shadow-xl"
    >
      {items.map((item) => (
        <button
          key={item.label}
          role="menuitem"
          disabled={item.disabled}
          onClick={() => {
            item.onClick()
            onClose()
          }}
          className={`w-full flex items-center gap-3 px-3 py-2 text-left font-sans text-sm transition-colors focus:outline-none disabled:opacity-40 disabled:pointer-events-none ${
            item.danger
              ? 'text-red-400 hover:bg-red-500/15 focus-visible:bg-red-500/15'
              : 'text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-high)] focus-visible:bg-[var(--color-surface-container-high)]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden>
            {item.icon}
          </span>
          {item.label}
        </button>
      ))}
    </div>
  )
}
