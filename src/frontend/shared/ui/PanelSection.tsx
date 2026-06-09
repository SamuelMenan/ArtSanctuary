'use client'

import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { fadeSlide } from '@frontend/shared/motion/tokens'

/**
 * Sección de panel reutilizable (estilo rail de herramientas/workspace): cabecera
 * en una **caja marcada** (fondo distinto + borde, a sangre completa) y cuerpo
 * debajo. SIEMPRE abierta (no colapsa). Pensada para apilarse en un aside; la
 * cabecera sangra a los bordes con `-mx-4` (el aside usa `p-4`).
 */
export default function PanelSection({
  title,
  icon,
  accent = false,
  children,
}: {
  title: string
  icon?: string
  /** Resalta el título en color primario (sección principal). */
  accent?: boolean
  children: ReactNode
}) {
  return (
    <motion.section variants={fadeSlide} className="flex flex-col">
      <div className="-mx-4 flex h-10 items-center gap-2 border-y border-[var(--color-outline-variant)] bg-[var(--color-surface-container-high)] px-4">
        {icon && <span className={`material-symbols-outlined text-[18px] leading-none ${accent ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)]'}`}>{icon}</span>}
        <h3 className={`font-mono text-sm uppercase tracking-[0.05em] ${accent ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface)]'}`}>{title}</h3>
      </div>
      <div className="pt-2">{children}</div>
    </motion.section>
  )
}
