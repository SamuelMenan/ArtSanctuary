'use client'

import type { ReactNode } from 'react'

/**
 * Panel lateral de opciones de la herramienta (estilo editor). Vertical, ancho
 * fijo. REQUISITO DURO: nunca scrollea ni desborda — los controles se reparten
 * en columna y cada sección envuelve dentro de su caja. Estructura recomendada:
 * cabecera (cambiar foto) → acciones (historial) → ajustes (clusters) →
 * pie pegado abajo (ToolPanelFooter con enviar/exportar).
 */
export default function ToolPanel({ children }: { children: ReactNode }) {
  return (
    <aside className="w-[272px] shrink-0 bg-[var(--color-surface-container)] border-r border-[var(--color-outline-variant)] flex flex-col gap-3 p-3 overflow-hidden">
      {children}
    </aside>
  )
}

/** Fila horizontal dentro del panel (p. ej. undo/redo, color + toggle). */
export function ToolRow({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-2">{children}</div>
}

/** Rejilla de controles iguales (segmented). `cols` define columnas. */
export function ToolGrid({ cols = 2, children }: { cols?: 2 | 3; children: ReactNode }) {
  return <div className={`grid ${cols === 3 ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>{children}</div>
}

/**
 * Pie del panel pegado abajo (`mt-auto`) con divisor sutil. Acciones de salida
 * (Volver / Tableros / Cuadrícula / Exportar) siempre visibles y separadas de
 * los ajustes de la herramienta.
 */
export function ToolPanelFooter({ children }: { children: ReactNode }) {
  return (
    <div className="mt-auto pt-3 border-t border-[var(--color-outline-variant)]/50">
      {children}
    </div>
  )
}
