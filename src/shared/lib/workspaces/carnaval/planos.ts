// Planos de un proyecto (Fase 5). Un plano es una vista geométrica
// (frontal/posterior/lateral/superior, que valida 2 ejes) o un plano especial
// (bastidores/jugadores, sin validación dimensional pero exigido por el
// reglamento en carro alegórico y carroza).

import { CARNAVAL_VIEWS, VIEW_AXES, type CarnavalView } from './views'
import { getCarnavalRule, type CarnavalModality } from './rules'

export type CarnavalPlano = CarnavalView | 'bastidores' | 'jugadores'

export const SPECIAL_PLANOS = ['bastidores', 'jugadores'] as const
export type SpecialPlano = (typeof SPECIAL_PLANOS)[number]

export const SPECIAL_PLANO_LABEL: Record<SpecialPlano, string> = {
  bastidores: 'Bastidores',
  jugadores: 'Jugadores',
}

/** Etiqueta de cualquier plano (geométrico o especial). */
export function planoLabel(plano: CarnavalPlano): string {
  return isGeometricView(plano) ? VIEW_AXES[plano].label : SPECIAL_PLANO_LABEL[plano]
}

/** ¿El plano es una vista geométrica que valida ejes? */
export function isGeometricView(plano: CarnavalPlano): plano is CarnavalView {
  return plano in VIEW_AXES
}

/**
 * Planos que componen un proyecto según la modalidad. Las 5 vistas geométricas
 * siempre; bastidores + jugadores solo donde el reglamento exige delimitar
 * zonas de jugadores (carro alegórico y carroza).
 */
export function planosForModality(modality: CarnavalModality): CarnavalPlano[] {
  const planos: CarnavalPlano[] = [...CARNAVAL_VIEWS]
  if (getCarnavalRule(modality).requiresPlayerZones) {
    planos.push('bastidores', 'jugadores')
  }
  return planos
}
