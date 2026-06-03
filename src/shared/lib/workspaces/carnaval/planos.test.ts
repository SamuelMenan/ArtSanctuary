import { describe, it, expect } from 'vitest'
import { planosForModality, isGeometricView, planoLabel } from './planos'

describe('planos por modalidad', () => {
  it('disfraz/comparsa: solo las 5 vistas geométricas', () => {
    expect(planosForModality('disfraz')).toEqual([
      'frontal', 'posterior', 'lateralIzq', 'lateralDer', 'superior',
    ])
    expect(planosForModality('comparsa')).toHaveLength(5)
  })

  it('carro y carroza: añaden bastidores + jugadores', () => {
    const carroza = planosForModality('carroza')
    expect(carroza).toContain('bastidores')
    expect(carroza).toContain('jugadores')
    expect(carroza).toHaveLength(7)
    expect(planosForModality('carroAlegorico')).toHaveLength(7)
  })

  it('isGeometricView distingue vistas de planos especiales', () => {
    expect(isGeometricView('frontal')).toBe(true)
    expect(isGeometricView('jugadores')).toBe(false)
    expect(isGeometricView('bastidores')).toBe(false)
  })

  it('planoLabel etiqueta vistas y especiales', () => {
    expect(planoLabel('frontal')).toBe('Frontal')
    expect(planoLabel('jugadores')).toBe('Jugadores')
  })
})
