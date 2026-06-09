'use client'

// Herramienta abierta DENTRO de un workspace. Reusa la misma pantalla que la
// versión global (`/dashboard/tools/<tool>`); el contexto de workspace (rail,
// handoff) lo aporta el id del pathname vía `ToolActiveLayout`. La chrome vive en
// `dashboard/layout.tsx` → cambiar de herramienta no re-monta nada (solo el
// contenido, con el fade de `template.tsx`).

import * as React from 'react'
import { notFound } from 'next/navigation'
import CropScreen from '@frontend/features/tools/crop/screens/CropScreen'
import CutoutScreen from '@frontend/features/tools/crop/screens/CutoutScreen'
import ReferenceGridScreen from '@frontend/features/tools/grid/screens/ReferenceGridScreen'
import NotanScreen from '@frontend/features/tools/notan/screens/NotanScreen'
import ColorMixScreen from '@frontend/features/tools/color-mixing/screens/ColorMixScreen'
import GestureScreen from '@frontend/features/tools/gesture/screens/GestureScreen'
import CanonScreen from '@frontend/features/tools/canon/screens/CanonScreen'

const SCREENS: Record<string, React.ComponentType> = {
  crop: CropScreen,
  cutout: CutoutScreen,
  grid: ReferenceGridScreen,
  notan: NotanScreen,
  'color-mixing': ColorMixScreen,
  gesture: GestureScreen,
  canon: CanonScreen,
}

export default function WorkspaceToolPage({ params }: { params: Promise<{ id: string; tool: string }> }) {
  const { tool } = React.use(params)
  const Screen = SCREENS[tool]
  if (!Screen) notFound()
  return <Screen />
}
