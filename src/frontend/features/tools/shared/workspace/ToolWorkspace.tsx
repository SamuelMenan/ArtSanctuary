'use client'

import type { ReactNode } from 'react'
import ToolPanel from './ToolPanel'

/**
 * Layout común de las herramientas de imagen: **panel lateral** de opciones a la
 * izquierda + lienzo a la derecha + pie de medidas full-width abajo. Reparte los
 * controles en columna para que NUNCA hagan wrap horizontal ni generen scroll
 * (requisito duro). El panel se oculta en pantallas chicas (< lg).
 */
export default function ToolWorkspace({
  panel,
  stage,
  footer,
  modal,
}: {
  panel: ReactNode
  stage: ReactNode
  footer?: ReactNode
  modal?: ReactNode
}) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div className="hidden lg:flex">
          <ToolPanel>{panel}</ToolPanel>
        </div>
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {stage}
        </div>
      </div>
      {footer}
      {modal}
    </div>
  )
}
