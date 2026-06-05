// Extensión de lienzo del workspace Carnaval. Compone Provider (estado UI),
// Layers (Konva) y Overlays (HTML) en la interfaz que el motor `boards` espera.

import type { BoardExtension, BoardExtSlotProps } from '@frontend/features/tools/boards/extensions/boardExtension'
import {
  getCarnavalRule,
  carnavalGridSquareCm,
  carnavalUsesHybridGrid,
  isGeometricView,
  type CarnavalView,
} from '@shared/lib/workspaces/carnaval'
import { pxOf } from '@shared/lib/measure'
import { CarnavalBoardProvider } from './context'
import CarnavalLayers from './CarnavalLayers'
import CarnavalOverlays from './CarnavalOverlays'
import CarnavalWorkspaceActions from './CarnavalWorkspaceActions'
import {
  buildCarnavalGuide,
  buildBaseFootprint,
  buildHybridGrid,
  carnavalGuideRef,
  gridAlignedOffsetCm,
  type GuideRect,
} from '../lib/carnavalGuide'

/**
 * Bordes de la guía reglamentaria como líneas-imán (px de mundo): al redimensionar
 * un objeto, sus lados se pegan también a la envolvente máx/mín/base de la vista.
 * Aplica el MISMO alineado a cuadrícula que el render (baseOffset), para que el
 * imán coincida con la guía dibujada. Usa la vista fija del plano (workspace.view);
 * en board libre cae a 'frontal'.
 */
function carnavalSnapLines(slot: BoardExtSlotProps): { x: number[]; y: number[] } {
  const rule = slot.workspace.modality ? getCarnavalRule(slot.workspace.modality) : null
  if (!rule) return { x: [], y: [] }
  const view = slot.workspace.view ?? 'frontal'
  const off = gridAlignedOffsetCm(carnavalGuideRef(rule, view), slot.squareCm)
  // Híbrido: el imán se pega a TODAS las líneas del grid híbrido (bordes +
  // subdivisiones). Uniforme: solo a los bordes de las envolventes.
  if (carnavalUsesHybridGrid(rule)) {
    const h = buildHybridGrid(rule, view)
    return {
      x: h.x.map((v) => pxOf(v + off.x)),
      y: h.y.map((v) => pxOf(v + off.y)),
    }
  }
  const xs = new Set<number>()
  const ys = new Set<number>()
  const addRect = (r: GuideRect) => {
    xs.add(pxOf(r.x + off.x))
    xs.add(pxOf(r.x + r.w + off.x))
    ys.add(pxOf(r.y + off.y))
    ys.add(pxOf(r.y + r.h + off.y))
  }
  if (isGeometricView(view)) {
    const g = buildCarnavalGuide(rule, view as CarnavalView)
    g.rects.forEach(addRect)
    g.lines.forEach((l) => ys.add(pxOf(l.y + off.y))) // figura humana
  } else {
    addRect(buildBaseFootprint(rule))
  }
  return { x: [...xs], y: [...ys] }
}

/** cm/cuadro que hace calzar las referencias (derivado de las medidas). */
function carnavalGrid(slot: BoardExtSlotProps): number {
  const rule = slot.workspace.modality ? getCarnavalRule(slot.workspace.modality) : null
  return rule ? carnavalGridSquareCm(rule) : 0
}

/** Modalidades coprimas (carroza/carro alegórico) usan grid híbrido propio → el
 *  motor no debe dibujar su grid uniforme. */
function carnavalSuppressBaseGrid(slot: BoardExtSlotProps): boolean {
  const rule = slot.workspace.modality ? getCarnavalRule(slot.workspace.modality) : null
  return rule ? carnavalUsesHybridGrid(rule) : false
}

export const carnavalBoardExtension: BoardExtension = {
  kind: 'carnaval',
  Provider: CarnavalBoardProvider,
  Layers: CarnavalLayers,
  Overlays: CarnavalOverlays,
  WorkspaceActions: CarnavalWorkspaceActions,
  snapLines: carnavalSnapLines,
  gridSquareCm: carnavalGrid,
  suppressBaseGrid: carnavalSuppressBaseGrid,
}
