// Vistas reglamentarias de un boceto y qué ejes valida cada una (Fase 5/6).
// Ninguna vista usa más que alto/ancho/largo: cada plano proyecta 2 de los 3.

import type { CarnavalAxis, CarnavalBase } from './rules'

export type CarnavalView = 'frontal' | 'posterior' | 'lateralIzq' | 'lateralDer' | 'superior'

export const CARNAVAL_VIEWS: CarnavalView[] = [
  'frontal',
  'posterior',
  'lateralIzq',
  'lateralDer',
  'superior',
]

/** Ejes que cada vista proyecta sobre el plano (horizontal × vertical). */
export const VIEW_AXES: Record<
  CarnavalView,
  { width: CarnavalAxis; height: CarnavalAxis; label: string }
> = {
  frontal: { width: 'ancho', height: 'alto', label: 'Frontal' },
  posterior: { width: 'ancho', height: 'alto', label: 'Posterior' },
  lateralIzq: { width: 'largo', height: 'alto', label: 'Lateral Izq.' },
  lateralDer: { width: 'largo', height: 'alto', label: 'Lateral Der.' },
  superior: { width: 'ancho', height: 'largo', label: 'Superior' },
}

/**
 * Vista en planta (desde arriba): su eje vertical NO es el alto, sino una
 * dimensión horizontal (largo). Hoy solo `superior`. En planta las zonas de
 * restricción se dibujan concéntricas (cuadro), no apiladas como en un alzado.
 */
export function isPlanView(view: CarnavalView): boolean {
  return VIEW_AXES[view].height !== 'alto'
}

/** Dimensión de la base a lo largo de un eje dado. */
export function baseAlong(base: CarnavalBase, axis: CarnavalAxis): number {
  if (axis === 'alto') return base.espesor
  if (axis === 'ancho') return base.ancho
  return base.largo // 'largo' o 'espesor' (espesor ya cubierto arriba)
}
