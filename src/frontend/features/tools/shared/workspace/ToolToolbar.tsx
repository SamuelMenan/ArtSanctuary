'use client'

import type { ReactNode } from 'react'

/**
 * Contenedor estándar de la barra de herramientas.
 *
 * REQUISITO DURO: cero scrollbars. NO usa `overflow-x-auto`. La barra **envuelve**
 * (`flex-wrap`) cuando no cabe, saltando a una segunda fila — nunca scrollea.
 */
export default function ToolToolbar({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[var(--color-surface-container)] border-b border-[var(--color-outline-variant)] shrink-0 px-[var(--spacing-grid-gutter)] py-2.5 flex flex-wrap items-center gap-x-3 gap-y-2 min-w-0">
      {children}
    </div>
  )
}

/** Separador vertical entre grupos del toolbar. */
export function ToolDivider() {
  return <span className="w-px h-6 bg-[var(--color-outline-variant)]/60 shrink-0" />
}

/** Empuja lo que sigue al extremo derecho (cuando hay espacio en la fila). */
export function ToolSpacer() {
  return <span className="flex-1 min-w-0" />
}
