// Tests del motor reglamentario Carnaval (Comunicado 003-2026). Vitest.
import { describe, it, expect } from 'vitest'
import {
  CARNAVAL_MODALITIES,
  carnavalGridSquareCm,
  getCarnavalRule,
  isCarnavalModality,
  bocetoToReal,
  realToBoceto,
} from './rules'
import { validateAxis, validateBoceto } from './validate'

describe('reglas carnaval', () => {
  it('expone las 4 modalidades oficiales', () => {
    expect(CARNAVAL_MODALITIES).toEqual(['disfraz', 'comparsa', 'carroAlegorico', 'carroza'])
  })

  it('disfraz: escala 1:10 y figura humana 15 cm', () => {
    const r = getCarnavalRule('disfraz')
    expect(r.scale).toBe(10)
    expect(r.humanRefCm).toBe(15)
    // Alto TOTAL desde la base = 15 (figura humana) + 12..15 de la tabla.
    expect(r.dims.alto).toEqual({ min: 27, max: 30 })
    expect(r.dims.ancho).toEqual({ min: 15, max: 25 })
    expect(r.dims.largo).toEqual({ min: 10, max: 20 })
  })

  it('disfraz: el alto máximo deja sitio justo para la figura humana', () => {
    const r = getCarnavalRule('disfraz')
    // La guía dibuja la envolvente de 0 a -alto y la línea de hombros a
    // -humanRefCm: si el alto dejara de incluirla, la línea saldría fuera.
    expect(r.dims.alto!.max! - r.humanRefCm!).toBe(15)
    expect(r.dims.alto!.min! - r.humanRefCm!).toBe(12)
  })

  it('el cuadro de cuadrícula sale del gcd de las medidas, no del campo declarado', () => {
    // 27 y 25 son coprimos → disfraz baja a 1 cm; comparsa se queda en 5.
    expect(carnavalGridSquareCm(getCarnavalRule('disfraz'))).toBe(1)
    expect(carnavalGridSquareCm(getCarnavalRule('comparsa'))).toBe(5)
  })

  it('carroza: base de madera exacta 32×110 negra', () => {
    const r = getCarnavalRule('carroza')
    expect(r.base).toMatchObject({ type: 'madera', ancho: 32, largo: 110, color: 'negro', exact: true })
  })

  it('isCarnavalModality discrimina valores persistidos', () => {
    expect(isCarnavalModality('carroza')).toBe(true)
    expect(isCarnavalModality('boardLibre')).toBe(false)
    expect(isCarnavalModality(null)).toBe(false)
  })

  it('boceto↔real respeta la escala', () => {
    const r = getCarnavalRule('carroza') // 1:15
    expect(bocetoToReal(r, 100)).toBe(1500)
    expect(realToBoceto(r, 1500)).toBe(100)
  })
})

describe('validación de ejes', () => {
  it('marca over cuando supera el máximo', () => {
    const res = validateAxis('alto', 16, { min: 12, max: 15 })
    expect(res.status).toBe('over')
  })

  it('marca under cuando baja del mínimo', () => {
    const res = validateAxis('alto', 10, { min: 12, max: 15 })
    expect(res.status).toBe('under')
  })

  it('marca warn cerca de un límite', () => {
    const res = validateAxis('alto', 14.9, { min: 12, max: 15 }) // banda 10% de span 3 = 0.3
    expect(res.status).toBe('warn')
  })

  it('ok holgado en el centro del rango', () => {
    const res = validateAxis('alto', 13.5, { min: 12, max: 15 })
    expect(res.status).toBe('ok')
  })

  it('mismatch en medida exacta fuera de tolerancia', () => {
    const res = validateAxis('espesor', 3, { exact: 2 })
    expect(res.status).toBe('mismatch')
  })

  it('na cuando el eje no aplica', () => {
    const res = validateAxis('largo', 50, undefined)
    expect(res.status).toBe('na')
  })
})

describe('validación de boceto completo', () => {
  it('boceto conforme reporta 100% y compliant', () => {
    const r = getCarnavalRule('disfraz')
    const rep = validateBoceto(r, { alto: 28.5, ancho: 20, largo: 15, espesor: 2 })
    expect(rep.compliant).toBe(true)
    expect(rep.compliancePct).toBe(100)
    expect(rep.observations).toHaveLength(0)
  })

  it('boceto con exceso baja el porcentaje y lista observaciones', () => {
    const r = getCarnavalRule('disfraz')
    const rep = validateBoceto(r, { alto: 40, ancho: 20, largo: 15, espesor: 2 })
    expect(rep.compliant).toBe(false)
    expect(rep.compliancePct).toBeLessThan(100)
    expect(rep.observations.length).toBeGreaterThan(0)
  })
})
