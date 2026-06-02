'use client'

import type { ReactNode } from 'react'

/**
 * Sección del panel de la herramienta: etiqueta arriba + controles debajo que
 * **envuelven** dentro de la caja (nunca desbordan a la página). Ocupa el ancho
 * del panel.
 */
export default function ToolCluster({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="rounded-lg bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/60 p-2.5 flex flex-col gap-2">
      <span className="font-mono text-[9px] text-[var(--color-on-surface-variant)]/70 uppercase tracking-[0.12em]">
        {name}
      </span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}
