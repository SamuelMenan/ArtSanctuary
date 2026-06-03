'use client'

// Estado UI compartido del board Carnaval: la vista/plano activo y si el
// Inspector está abierto. Vive en contexto porque lo consumen tanto la capa
// Konva (`CarnavalLayers`, dentro del Stage) como los overlays HTML
// (`CarnavalOverlays`), que renderizan en árboles distintos.

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { CarnavalPlano } from '@shared/lib/workspaces/carnaval'
import type { BoardExtSlotProps } from '@frontend/features/tools/boards/extensions/boardExtension'

interface CarnavalBoardCtx {
  view: CarnavalPlano
  setView: (v: CarnavalPlano) => void
  inspectorOpen: boolean
  setInspectorOpen: (open: boolean) => void
  /** La vista viene fijada por el plano del proyecto (no se muestra el selector). */
  planoFixed: boolean
}

const Ctx = createContext<CarnavalBoardCtx | null>(null)

export function useCarnavalBoard(): CarnavalBoardCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCarnavalBoard fuera de CarnavalBoardProvider')
  return ctx
}

export function CarnavalBoardProvider({
  workspace,
  children,
}: BoardExtSlotProps & { children: ReactNode }) {
  const [view, setView] = useState<CarnavalPlano>(workspace.view ?? 'frontal')
  const [inspectorOpen, setInspectorOpen] = useState(false)

  // Vista fijada por el plano del proyecto (Fase 3), si la hay.
  useEffect(() => {
    if (workspace.view) setView(workspace.view)
  }, [workspace.view])

  const planoFixed = !!workspace.view

  return (
    <Ctx.Provider value={{ view, setView, inspectorOpen, setInspectorOpen, planoFixed }}>
      {children}
    </Ctx.Provider>
  )
}
