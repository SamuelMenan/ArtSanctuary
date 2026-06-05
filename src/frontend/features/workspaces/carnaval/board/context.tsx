'use client'

// Estado UI compartido del board Carnaval: la vista/plano activo y si el
// Inspector está abierto. Vive en contexto porque lo consumen tanto la capa
// Konva (`CarnavalLayers`, dentro del Stage) como los overlays HTML
// (`CarnavalOverlays`), que renderizan en árboles distintos.

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getCarnavalRule, type CarnavalPlano } from '@shared/lib/workspaces/carnaval'
import type { BoardExtSlotProps } from '@frontend/features/tools/boards/extensions/boardExtension'
import { carnavalGuideRef, gridAlignedOffsetCm } from '../lib/carnavalGuide'

// Separación (cm) entre guías reglamentarias consecutivas (para no solaparlas).
const GUIDE_GAP_CM = 60

/** Desplazamiento (cm) de una guía colocada respecto a la reglamentaria base. */
export type GuideOffset = { x: number; y: number }

interface CarnavalBoardCtx {
  view: CarnavalPlano
  setView: (v: CarnavalPlano) => void
  inspectorOpen: boolean
  setInspectorOpen: (open: boolean) => void
  /** La vista viene fijada por el plano del proyecto (no se muestra el selector). */
  planoFixed: boolean
  /** Desplazamientos (cm) de las guías reglamentarias extra colocadas. */
  guideOffsets: GuideOffset[]
  /** Coloca otra copia de la guía reglamentaria de la vista actual, a la derecha. */
  addGuide: () => void
  /** Quita todas las guías extra. */
  clearGuides: () => void
}

const Ctx = createContext<CarnavalBoardCtx | null>(null)

export function useCarnavalBoard(): CarnavalBoardCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCarnavalBoard fuera de CarnavalBoardProvider')
  return ctx
}

export function CarnavalBoardProvider({
  workspace,
  squareCm,
  children,
}: BoardExtSlotProps & { children: ReactNode }) {
  const [view, setView] = useState<CarnavalPlano>(workspace.view ?? 'frontal')
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [guideOffsets, setGuideOffsets] = useState<GuideOffset[]>([])

  // Vista fijada por el plano del proyecto (Fase 3), si la hay.
  useEffect(() => {
    if (workspace.view) setView(workspace.view)
  }, [workspace.view])

  // Al cambiar de vista, las guías extra (medidas de otra vista) dejan de aplicar.
  useEffect(() => {
    setGuideOffsets([])
  }, [view])

  const planoFixed = !!workspace.view
  const rule = workspace.modality ? getCarnavalRule(workspace.modality) : null

  const addGuide = () => {
    if (!rule) return
    const r = carnavalGuideRef(rule, view)
    // Cada copia se desplaza a la derecha y su esquina (sup-izq) se ALINEA a la
    // esquina del cuadro mayor (squareCm), igual que la guía base.
    setGuideOffsets((prev) => {
      const shifted = { x: r.x + (prev.length + 1) * (r.w + GUIDE_GAP_CM), y: r.y }
      return [...prev, gridAlignedOffsetCm(shifted, squareCm)]
    })
  }
  const clearGuides = () => setGuideOffsets([])

  return (
    <Ctx.Provider
      value={{ view, setView, inspectorOpen, setInspectorOpen, planoFixed, guideOffsets, addGuide, clearGuides }}
    >
      {children}
    </Ctx.Provider>
  )
}
