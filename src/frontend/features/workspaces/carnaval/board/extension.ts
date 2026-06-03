// Extensión de lienzo del workspace Carnaval. Compone Provider (estado UI),
// Layers (Konva) y Overlays (HTML) en la interfaz que el motor `boards` espera.

import type { BoardExtension } from '@frontend/features/tools/boards/extensions/boardExtension'
import { CarnavalBoardProvider } from './context'
import CarnavalLayers from './CarnavalLayers'
import CarnavalOverlays from './CarnavalOverlays'

export const carnavalBoardExtension: BoardExtension = {
  kind: 'carnaval',
  Provider: CarnavalBoardProvider,
  Layers: CarnavalLayers,
  Overlays: CarnavalOverlays,
}
