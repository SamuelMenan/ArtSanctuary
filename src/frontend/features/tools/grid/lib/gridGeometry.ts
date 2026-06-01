// Import relativo (no alias) para que el test de Vitest resuelva sin config.
import { applyScale } from '../../../../../shared/lib/measure'

export interface GridGeometryInput {
  realWidthCm: number
  squareCm: number
  imgNatural: { w: number; h: number }
  stage: { w: number; h: number }
  opacity: number
  color: string
}

export interface GridGeometry {
  cols: number
  rows: number
  /** Ancho efectivo (cm), ya múltiplo del cuadro. */
  effWidthCm: number
  realHeightCm: number
  targetCm: number
  /** Factor de escala global aplicado al cuadro. */
  factor: number
  canvasW: number
  canvasH: number
  /** px por celda al encajar cols:rows en el escenario. */
  fit: number
  frameW: number
  frameH: number
  /** Medidas de referencia (cm) = nº cuadros × tamaño cuadro. */
  refW: number
  refH: number
  /** CSS de la cuadrícula superpuesta (líneas con alfa). */
  gridStyle: { backgroundImage: string; backgroundSize: string }
}

/**
 * Geometría de la cuadrícula de referencia: deriva columnas/filas (ancho real
 * forzado a múltiplo del cuadro), tamaño del lienzo exportado, encuadre en
 * pantalla con celdas cuadradas y el CSS de las líneas superpuestas. Pura.
 */
export function computeGridGeometry({
  realWidthCm,
  squareCm,
  imgNatural,
  stage,
  opacity,
  color,
}: GridGeometryInput): GridGeometry {
  const aspect = imgNatural.h / imgNatural.w
  const cols = Math.max(1, Math.round(realWidthCm / squareCm))
  const effWidthCm = cols * squareCm
  const realHeightCm = Math.max(1, effWidthCm * aspect)
  const rows = Math.max(1, Math.round(realHeightCm / squareCm))

  const targetCm = applyScale(squareCm)
  const factor = targetCm / squareCm
  const canvasW = Math.round(cols * targetCm)
  const canvasH = Math.round(rows * targetCm)

  // Encaja cols:rows en el escenario → celdas perfectamente cuadradas (idéntico al PNG).
  const fit = Math.min((Math.min(stage.w, 920) || 0) / cols, (stage.h || 0) / rows)
  const frameW = fit > 0 ? cols * fit : 0
  const frameH = fit > 0 ? rows * fit : 0

  const refW = cols * squareCm
  const refH = rows * squareCm

  const alphaHex = Math.round(opacity * 2.55).toString(16).padStart(2, '0')
  const gridStyle = {
    backgroundImage: `linear-gradient(to right, ${color}${alphaHex} 1px, transparent 1px),
                      linear-gradient(to bottom, ${color}${alphaHex} 1px, transparent 1px)`,
    backgroundSize: `${100 / cols}% ${100 / rows}%`,
  }

  return { cols, rows, effWidthCm, realHeightCm, targetCm, factor, canvasW, canvasH, fit, frameW, frameH, refW, refH, gridStyle }
}

/** Ancho ajustado al múltiplo del cuadro más cercano (mínimo: un cuadro). */
export const snapToSquare = (cm: number, squareCm: number) =>
  Math.max(squareCm, Math.round(cm / squareCm) * squareCm)
