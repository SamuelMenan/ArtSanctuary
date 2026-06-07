// Import relativo (no alias) para que Vitest resuelva sin config extra.
import { describe, it, expect } from 'vitest'
import { CANONS, SEGMENT_ORDER } from './canons'
import { buildFigure } from './figure'

describe('canons (data)', () => {
  it('cada canon: los segmentos suman exactamente headCount', () => {
    for (const canon of Object.values(CANONS)) {
      const sum = canon.segments.reduce((a, s) => a + s.heads, 0)
      expect(sum).toBeCloseTo(canon.headCount, 6)
    }
  })

  it('cada canon usa los 7 segmentos canónicos en orden', () => {
    for (const canon of Object.values(CANONS)) {
      expect(canon.segments.map((s) => s.key)).toEqual([...SEGMENT_ORDER])
    }
  })

  it('muslo crece con el canon (académico 1.5 < heroico)', () => {
    const aThigh = CANONS.academic.segments.find((s) => s.key === 'thigh')!.heads
    const hThigh = CANONS.heroic.segments.find((s) => s.key === 'thigh')!.heads
    expect(aThigh).toBe(1.5)
    expect(hThigh).toBeGreaterThan(aThigh)
  })
})

describe('buildFigure', () => {
  it('default = académico 7.5; headCm = altura / 7.5', () => {
    const m = buildFigure({ heightCm: 150 })
    expect(m.canonId).toBe('academic')
    expect(m.headCount).toBe(7.5)
    expect(m.headCm).toBeCloseTo(20, 6)
  })

  it('anchos en cm = ancho-canon · headCm', () => {
    const m = buildFigure({ canonId: 'heroic', heightCm: 160 })
    expect(m.widthsCm.shoulders).toBeCloseTo(CANONS.heroic.widths.shoulders * m.headCm, 6)
  })

  it('cambiar de canon reescala (heroico = 8 cabezas, cabeza más chica a igual altura)', () => {
    const academic = buildFigure({ canonId: 'academic', heightCm: 160 })
    const heroic = buildFigure({ canonId: 'heroic', heightCm: 160 })
    expect(heroic.headCount).toBe(8)
    expect(heroic.headCm).toBeLessThan(academic.headCm)
  })

  it('canon desconocido cae al académico', () => {
    const m = buildFigure({ canonId: 'no-existe', heightCm: 150 })
    expect(m.canonId).toBe('academic')
  })
})
