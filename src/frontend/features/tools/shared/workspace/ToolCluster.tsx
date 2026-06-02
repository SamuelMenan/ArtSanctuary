'use client'

import type { ReactNode } from 'react'

/**
 * Sección del panel de la herramienta: cabecera (etiqueta) + cuerpo en columna.
 * Tarjeta elevada sutil sobre el panel para separar grupos. Los hijos se apilan
 * con gap consistente; usa ToolGrid/ToolRow dentro para layouts horizontales.
 * REQUISITO DURO: nunca desborda a la página.
 */
export default function ToolCluster({ name, children }: { name: string; children: ReactNode }) {
  return (
    <section className="rounded-lg bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/50 p-3 flex flex-col gap-2.5">
      <span className="font-mono text-[10px] font-medium text-[var(--color-on-surface-variant)] uppercase tracking-[0.14em] leading-none">
        {name}
      </span>
      <div className="flex flex-col gap-2.5">{children}</div>
    </section>
  )
}
