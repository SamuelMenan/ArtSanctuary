'use client'

import { motion } from 'motion/react'
import { fadeSlide } from '@frontend/shared/motion/tokens'

/**
 * Botón cuadrado unificado para los rails flotantes del lienzo (capas / zoom /
 * export). Caja cuadrada con borde, icono centrado. `active` (toggle) lo rellena
 * en primario; sin `active` es un botón de acción normal. Entra escalonado (toma
 * `fadeSlide` del rail padre) y responde al pulsar (`whileTap`).
 */
export default function RailButton({
  icon,
  title,
  active,
  disabled = false,
  onClick,
}: {
  icon: string
  title: string
  /** Toggle: true = activo (relleno). Omitir para botón de acción. */
  active?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      type="button"
      variants={fadeSlide}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`flex size-9 items-center justify-center rounded-lg border transition-colors disabled:opacity-40 disabled:pointer-events-none ${
        active
          ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-on-primary)]'
          : 'border-[var(--color-outline-variant)] bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
      }`}
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
    </motion.button>
  )
}
