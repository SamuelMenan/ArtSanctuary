'use client'

import type { ReactNode } from 'react'

/**
 * Agrupa controles relacionados en una caja con etiqueta (la etiqueta se oculta
 * en pantallas chicas para ahorrar ancho — sin scroll). Mismo patrón para las 3
 * herramientas.
 */
export default function ToolCluster({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-3 h-10 rounded-lg bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/60 shrink-0">
      <span className="font-mono text-[9px] text-[var(--color-on-surface-variant)]/70 uppercase tracking-[0.12em] hidden xl:inline">
        {name}
      </span>
      {children}
    </div>
  )
}
