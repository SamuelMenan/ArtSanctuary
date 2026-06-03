// Glue del motor para renderizar la extensión de un tipo de workspace.
// Resuelve los slots opcionales (Provider/Layers/Overlays) sin que el motor
// sepa nada del tipo concreto. Si no hay extensión, no renderiza nada.

import type { ReactNode } from 'react'
import type { BoardExtension, BoardExtSlotProps } from './boardExtension'

/** Envuelve el árbol del editor con el Provider de la extensión (estado UI). */
export function BoardExtProvider({
  extension,
  slot,
  children,
}: {
  extension?: BoardExtension
  slot: BoardExtSlotProps
  children: ReactNode
}) {
  const Provider = extension?.Provider
  return Provider ? <Provider {...slot}>{children}</Provider> : <>{children}</>
}

/** Capa Konva de la extensión (dentro del Stage). */
export function BoardExtLayers({
  extension,
  slot,
}: {
  extension?: BoardExtension
  slot: BoardExtSlotProps
}) {
  const Layers = extension?.Layers
  return Layers ? <Layers {...slot} /> : null
}

/** Overlays HTML de la extensión (sobre el lienzo). */
export function BoardExtOverlays({
  extension,
  slot,
}: {
  extension?: BoardExtension
  slot: BoardExtSlotProps
}) {
  const Overlays = extension?.Overlays
  return Overlays ? <Overlays {...slot} /> : null
}
