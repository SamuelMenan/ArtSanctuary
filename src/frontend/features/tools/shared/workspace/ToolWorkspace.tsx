'use client'

import type { ReactNode } from 'react'

/**
 * Layout común de las herramientas de imagen: toolbar arriba, lienzo flexible y
 * pie de medidas opcional. REQUISITO DURO: el conjunto cabe sin scroll (la barra
 * envuelve, el lienzo recorta). Columna a altura completa del canvas de la tool.
 */
export default function ToolWorkspace({
  toolbar,
  stage,
  footer,
  modal,
}: {
  toolbar: ReactNode
  stage: ReactNode
  footer?: ReactNode
  modal?: ReactNode
}) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      {toolbar}
      {stage}
      {footer}
      {modal}
    </div>
  )
}
