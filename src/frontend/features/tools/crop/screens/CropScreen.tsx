'use client'

import CropTool from '@frontend/features/tools/crop/CropTool'

/** Herramienta de Recorte. "Quitar fondo" se separó a su propia herramienta
 *  (`CutoutScreen` · `/dashboard/tools/cutout`); aquí ya no hay pestañas. */
export default function CropScreen() {
  return <CropTool />
}
