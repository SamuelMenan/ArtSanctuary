'use client'

// Capa Konva de la extensión Carnaval: envolvente reglamentaria por vista
// (planos geométricos) o huella de base (planos especiales). Se renderiza
// dentro del Stage del board vía el slot `Layers` de la extensión.

import { getCarnavalRule, isGeometricView } from '@shared/lib/workspaces/carnaval'
import type { BoardExtSlotProps } from '@frontend/features/tools/boards/extensions/boardExtension'
import { useCarnavalBoard } from './context'
import CarnavalGuideLayer from './CarnavalGuideLayer'
import CarnavalBaseLayer from './CarnavalBaseLayer'

export default function CarnavalLayers({ workspace, scale }: BoardExtSlotProps) {
  const { view } = useCarnavalBoard()
  const rule = workspace.modality ? getCarnavalRule(workspace.modality) : null
  if (!rule) return null

  return (
    <>
      {isGeometricView(view) ? (
        <CarnavalGuideLayer rule={rule} view={view} scale={scale} />
      ) : (
        <CarnavalBaseLayer rule={rule} scale={scale} />
      )}
    </>
  )
}
