'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { scaleIn } from '@frontend/shared/motion/tokens'
import { island, ISLAND } from './islandStyles'
import IconButton from './IconButton'

/**
 * Contenedor flotante anclado a un botón-icono. Cierra por clic-fuera y Escape.
 * Sin animación todavía (se anima en el plan de animaciones). Por defecto abre
 * hacia la izquierda del disparador (pensado para el rail derecho).
 */
export default function Popover({
  icon,
  label,
  active,
  side = 'left',
  children,
}: {
  icon: string
  label: string
  /** Estado activo del disparador independiente de la apertura. */
  active?: boolean
  side?: 'left' | 'right'
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <IconButton
        icon={icon}
        label={label}
        active={open || active}
        pressed={open}
        onClick={() => setOpen((v) => !v)}
      />
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label={label}
            className={`${island} top-0 ${side === 'left' ? 'right-full mr-2' : 'left-full ml-2'} ${ISLAND.islandRadius} p-2 w-max`}
            style={{ transformOrigin: side === 'left' ? 'top right' : 'top left' }}
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
