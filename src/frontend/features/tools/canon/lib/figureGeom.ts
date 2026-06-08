// Geometría de la caja de la figura: conversión cm ↔ fracción de caja.
//
// Solo calibramos la ALTURA (coronilla→planta = heightCm). Asumiendo que la
// lámina está a escala uniforme (mismo cm/px en X e Y, que es lo normal en un
// dibujo sin deformar), el ANCHO en cm de la caja se deriva de las dims
// intrínsecas: cmPorPx = heightCm / imgH → boxWidthCm = imgW · cmPorPx.

import { figureDims, type View } from './figureMeta'

/** Ancho de la caja de la figura en cm (a la altura/escala dadas). */
export function boxWidthCm(canonId: string, view: View, heightCm: number): number {
  const { w, h } = figureDims(canonId, view)
  return (w / h) * heightCm
}

/** Ancho anatómico (cm) → fracción del ancho de la caja (0..1). */
export function widthFrac(canonId: string, view: View, heightCm: number, cm: number): number {
  const boxW = boxWidthCm(canonId, view, heightCm)
  return boxW > 0 ? cm / boxW : 0
}

/** Punto en la caja (fracción 0..1 en X e Y) → coordenadas en cm. */
export function pointToCm(
  canonId: string,
  view: View,
  heightCm: number,
  xFrac: number,
  yFrac: number,
): { xCm: number; yCm: number } {
  return { xCm: xFrac * boxWidthCm(canonId, view, heightCm), yCm: yFrac * heightCm }
}

/** Distancia en cm entre dos puntos (fracciones de caja). */
export function distanceCm(
  canonId: string,
  view: View,
  heightCm: number,
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  const pa = pointToCm(canonId, view, heightCm, a.x, a.y)
  const pb = pointToCm(canonId, view, heightCm, b.x, b.y)
  return Math.hypot(pb.xCm - pa.xCm, pb.yCm - pa.yCm)
}
