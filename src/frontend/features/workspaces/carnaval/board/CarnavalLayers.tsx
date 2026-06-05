'use client'

// Capa Konva de la extensión Carnaval: envolvente reglamentaria por vista
// (planos geométricos) o huella de base (planos especiales). Se renderiza
// dentro del Stage del board vía el slot `Layers` de la extensión.

import { getCarnavalRule, isGeometricView, carnavalUsesHybridGrid } from '@shared/lib/workspaces/carnaval'
import type { BoardExtSlotProps } from '@frontend/features/tools/boards/extensions/boardExtension'
import { useCarnavalBoard } from './context'
import { carnavalGuideRef, gridAlignedOffsetCm } from '../lib/carnavalGuide'
import CarnavalGuideLayer from './CarnavalGuideLayer'
import CarnavalBaseLayer from './CarnavalBaseLayer'
import CarnavalHybridGrid from './CarnavalHybridGrid'
import CarnavalMeasuredBBox from './CarnavalMeasuredBBox'

export default function CarnavalLayers({ workspace, objects, scale, pos, stageSize, squareCm }: BoardExtSlotProps) {
  const { view, guideOffsets, inspectorOpen } = useCarnavalBoard()
  const rule = workspace.modality ? getCarnavalRule(workspace.modality) : null
  if (!rule) return null

  // La guía base también se alinea a la esquina de un cuadro (igual que las copias).
  const baseOffset = gridAlignedOffsetCm(carnavalGuideRef(rule, view), squareCm)
  const hybrid = carnavalUsesHybridGrid(rule)

  return (
    <>
      {/* Grid híbrido (reemplaza al uniforme del motor en modalidades coprimas).
          Cubre todo el tablero: bandas exactas en la referencia + continuación. */}
      {hybrid && (
        <CarnavalHybridGrid rule={rule} view={view} scale={scale} pos={pos} stageSize={stageSize} baseOffset={baseOffset} />
      )}
      {isGeometricView(view) ? (
        <CarnavalGuideLayer rule={rule} view={view} scale={scale} baseOffset={baseOffset} offsets={guideOffsets} />
      ) : (
        <CarnavalBaseLayer rule={rule} scale={scale} baseOffset={baseOffset} offsets={guideOffsets} />
      )}
      {/* Envolvente que mide el Inspector (solo con el panel abierto). */}
      {inspectorOpen && isGeometricView(view) && (
        <CarnavalMeasuredBBox objects={objects} scale={scale} />
      )}
    </>
  )
}
