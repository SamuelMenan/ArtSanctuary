'use client'

import type { ReactNode } from 'react'

/**
 * Panel lateral de opciones de la herramienta (estilo editor). Vertical, ancho
 * fijo. REQUISITO DURO: nunca scrollea ni desborda — los controles se reparten
 * en columna y cada sección envuelve dentro de su caja.
 */
export default function ToolPanel({ children }: { children: ReactNode }) {
  return (
    <aside className="w-[260px] shrink-0 bg-[var(--color-surface-container)] border-r border-[var(--color-outline-variant)] flex flex-col gap-2.5 p-3 overflow-hidden">
      {children}
    </aside>
  )
}

/** Fila horizontal dentro del panel (p. ej. undo/redo, enviar/exportar). */
export function ToolRow({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-2">{children}</div>
}
