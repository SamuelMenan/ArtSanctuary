'use client'

import { AnimatePresence, motion } from 'motion/react'
import { transition } from '@frontend/shared/motion/tokens'
import { islandIdle, islandOn } from './islandStyles'

/**
 * Botón-icono primitivo de las islas. Unifica radios, tamaños, estado activo y
 * accesibilidad en un solo sitio (TopBar/ToolIsland/RightRail/ZoomIsland).
 * `aria-label` obligatorio; el glifo va `aria-hidden`. Feedback `whileHover`/
 * `whileTap` sutil y cross-fade al cambiar de icono (lock/lock_open, etc.).
 */
export default function IconButton({
  icon,
  label,
  onClick,
  active,
  danger,
  disabled,
  pressed,
  title,
}: {
  /** Glifo de material-symbols. */
  icon: string
  /** Texto accesible (aria-label) y tooltip por defecto. */
  label: string
  onClick?: () => void
  /** Estado activo (toggle encendido): fondo primario + anillo. */
  active?: boolean
  /** Acción destructiva: realce rojo en hover. */
  danger?: boolean
  disabled?: boolean
  /** Valor de `aria-pressed` (solo para toggles). */
  pressed?: boolean
  title?: string
}) {
  const cls = danger ? `${islandIdle} hover:!bg-red-500/15 hover:!text-red-500` : islandOn(!!active)
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title ?? label}
      aria-label={label}
      aria-pressed={pressed}
      className={cls}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={transition.fast}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={icon}
          className="material-symbols-outlined text-[20px]"
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition.fast}
        >
          {icon}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}
