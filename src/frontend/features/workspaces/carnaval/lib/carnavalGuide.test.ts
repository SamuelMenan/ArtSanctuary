import { describe, it, expect } from 'vitest'
import { buildCarnavalGuide, carnavalGuideRef, gridAlignedOffsetCm } from './carnavalGuide'
import { getCarnavalRule, carnavalGridSquareCm } from '@shared/lib/workspaces/carnaval'

describe('buildCarnavalGuide', () => {
  it('frontal disfraz: envolvente máxima 25×30 centrada y apoyada en base', () => {
    const g = buildCarnavalGuide(getCarnavalRule('disfraz'), 'frontal')
    const max = g.rects.find((r) => r.kind === 'max')!
    expect(max.w).toBe(25) // ancho
    expect(max.h).toBe(30) // alto TOTAL (figura humana incluida)
    expect(max.x).toBe(-12.5) // centrada
    expect(max.y).toBe(-30) // apoyada en base (crece hacia arriba)
  })

  it('frontal disfraz: la línea de hombros cae DENTRO de la envolvente máxima', () => {
    const g = buildCarnavalGuide(getCarnavalRule('disfraz'), 'frontal')
    const max = g.rects.find((r) => r.kind === 'max')!
    expect(g.rects.some((r) => r.kind === 'base' && r.w === 20)).toBe(true)
    const human = g.lines.find((l) => l.kind === 'human')!
    expect(human.y).toBe(-15)
    // 15 cm de hombros + 15 cm de obra hacia arriba = los 30 cm de la envolvente.
    expect(human.y - max.y).toBe(15)
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

  it('superior: zonas concéntricas centradas en el origen (vista en planta)', () => {
    const g = buildCarnavalGuide(getCarnavalRule('carroza'), 'superior')
    const max = g.rects.find((r) => r.kind === 'max')!
    const base = g.rects.find((r) => r.kind === 'base')!
    // Centradas: y = -h/2 (no apoyadas en y=0 como en un alzado).
    expect(max.x).toBe(-max.w / 2)
    expect(max.y).toBe(-max.h / 2)
    expect(base.x).toBe(-base.w / 2)
    expect(base.y).toBe(-base.h / 2)
    // Bounds centrados en el origen.
    expect(g.bounds.x).toBe(-g.bounds.w / 2)
    expect(g.bounds.y).toBe(-g.bounds.h / 2)
  })

  // La guía se pinta dentro de un Group desplazado por este offset, pero los
  // objetos del board (la figura humana) viven en coordenadas de mundo sin
  // desplazar. Que sea DISTINTO de cero es justo lo que descentraba la figura:
  // quien se ancle a la guía tiene que sumarlo.
  it('disfraz frontal: la guía se desplaza 0.5 cm para alinearse al cuadro', () => {
    const rule = getCarnavalRule('disfraz')
    const off = gridAlignedOffsetCm(carnavalGuideRef(rule, 'frontal'), carnavalGridSquareCm(rule))
    // Envolvente en x=-12.5 con cuadro de 1 cm → medio centímetro de ajuste.
    // (Con la tabla anterior el cuadro era de 5 cm y el desfase, de 2.5.)
    expect(off).toEqual({ x: 0.5, y: 0 })
  })

  it('frontal comparsa: sin envolvente mínima cuando falta ancho.min', () => {
    const g = buildCarnavalGuide(getCarnavalRule('comparsa'), 'frontal')
    expect(g.rects.some((r) => r.kind === 'min')).toBe(false)
  })
})
