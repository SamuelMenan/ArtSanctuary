// Tests de buildGridLines. Imports relativos (sin alias) para Vitest sin config.
import { describe, it, expect } from 'vitest'
import { buildGridLines } from './grid'
import { PX_PER_CM } from '../../../../../shared/lib/measure'

const base = {
  type: 'grid',
  squareCm: 1,
  stageW: 100,
  stageH: 100,
  pos: { x: 0, y: 0 },
  scale: 1,
}

describe('buildGridLines', () => {
  it('devuelve vacío si el fondo no es cuadrícula', () => {
    expect(buildGridLines({ ...base, type: 'solid' })).toEqual({ minor: [], major: [] })
  })

  it('devuelve vacío si el escenario no tiene ancho', () => {
    expect(buildGridLines({ ...base, stageW: 0 })).toEqual({ minor: [], major: [] })
  })

  it('separación mayor = squareCm * PX_PER_CM con suelo en 8 px', () => {
    // squareCm=1 → 37.795 px; viewport 100px ⇒ verticales en 0,37.8,75.6 = 3,
    // más horizontales 3 ⇒ 6 líneas mayores.
    const { major } = buildGridLines(base)
    const gap = Math.max(8, 1 * PX_PER_CM)
    const verticals = major.filter((l) => l.key.startsWith('v'))
    expect(verticals.map((l) => l.points[0])).toEqual([-0, gap, gap * 2])
    expect(major).toHaveLength(6)
  })

  it('aplica suelo de 8 px a cuadros diminutos', () => {
    const { major } = buildGridLines({ ...base, squareCm: 0.01 })
    const verticals = major.filter((l) => l.key.startsWith('v'))
    // gap=8 ⇒ 0,8,16,...,96 = 13 verticales
    expect(verticals).toHaveLength(13)
    expect(verticals[1].points[0]).toBe(8)
  })

  it('oculta las menores cuando quedan < 6 px en pantalla', () => {
    // squareCm grande, scale minúsculo ⇒ minor*scale ≤ 6.
    const { minor } = buildGridLines({ ...base, squareCm: 1, scale: 0.1 })
    // minor = 37.795/2 = 18.9; *0.1 = 1.89 < 6 ⇒ vacío
    expect(minor).toEqual([])
  })

  it('incluye menores cuando hay espacio suficiente', () => {
    const { minor, major } = buildGridLines({ ...base, squareCm: 2 })
    expect(minor.length).toBeGreaterThan(0)
    // menor = mitad de la mayor ⇒ más líneas que la mayor
    expect(minor.length).toBeGreaterThan(major.length)
  })

  it('acota las líneas al viewport desplazado (pos/scale)', () => {
    const { major } = buildGridLines({ ...base, pos: { x: -50, y: -50 }, scale: 1 })
    const v = major.find((l) => l.key.startsWith('v'))!
    // top = -pos.y/scale = 50; las verticales abarcan [top, bottom]
    expect(v.points[1]).toBe(50)
  })
})
