import { describe, it, expect } from 'vitest'
import { buildCarnavalGuide } from './carnavalGuide'
import { getCarnavalRule } from '@shared/lib/workspaces/carnaval'

describe('buildCarnavalGuide', () => {
  it('frontal disfraz: envolvente máxima 25×15 centrada y apoyada en base', () => {
    const g = buildCarnavalGuide(getCarnavalRule('disfraz'), 'frontal')
    const max = g.rects.find((r) => r.kind === 'max')!
    expect(max.w).toBe(25) // ancho
    expect(max.h).toBe(15) // alto
    expect(max.x).toBe(-12.5) // centrada
    expect(max.y).toBe(-15) // apoyada en base (crece hacia arriba)
  })

  it('frontal disfraz: incluye base y figura humana a 15 cm', () => {
    const g = buildCarnavalGuide(getCarnavalRule('disfraz'), 'frontal')
    expect(g.rects.some((r) => r.kind === 'base' && r.w === 20)).toBe(true)
    expect(g.lines.find((l) => l.kind === 'human')!.y).toBe(-15)
  })

  it('posterior valida mismos ejes que frontal (ancho×alto)', () => {
    const f = buildCarnavalGuide(getCarnavalRule('disfraz'), 'frontal')
    const p = buildCarnavalGuide(getCarnavalRule('disfraz'), 'posterior')
    expect(p.rects.find((r) => r.kind === 'max')).toEqual(f.rects.find((r) => r.kind === 'max'))
  })

  it('lateral carroza: width = largo (86.6–106.6), height = alto', () => {
    const g = buildCarnavalGuide(getCarnavalRule('carroza'), 'lateralIzq')
    const max = g.rects.find((r) => r.kind === 'max')!
    expect(max.w).toBe(106.6) // largo.max
    expect(max.h).toBe(41.3) // alto.max
  })

  it('superior carroza: width = ancho, height = largo, sin figura humana', () => {
    const g = buildCarnavalGuide(getCarnavalRule('carroza'), 'superior')
    const max = g.rects.find((r) => r.kind === 'max')!
    expect(max.w).toBe(28.6) // ancho.max
    expect(max.h).toBe(106.6) // largo.max
    expect(g.lines).toHaveLength(0) // vista superior no dibuja figura humana
  })

  it('superior: base es huella completa ancho×largo', () => {
    const g = buildCarnavalGuide(getCarnavalRule('carroza'), 'superior')
    const base = g.rects.find((r) => r.kind === 'base')!
    expect(base.w).toBe(32) // base.ancho
    expect(base.h).toBe(110) // base.largo (huella, no espesor)
  })

  it('frontal comparsa: sin envolvente mínima cuando falta ancho.min', () => {
    const g = buildCarnavalGuide(getCarnavalRule('comparsa'), 'frontal')
    expect(g.rects.some((r) => r.kind === 'min')).toBe(false)
  })
})
