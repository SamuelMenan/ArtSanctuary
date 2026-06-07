import { describe, it, expect } from 'vitest'
import { buildFigure } from './figure'
import { buildMeasurements, ANATOMY_REFERENCE, withinRef } from './measurements'

describe('buildMeasurements', () => {
  it('incluye unidad, anchos y largos', () => {
    const m = buildMeasurements(buildFigure({ heightCm: 175 }))
    const groups = new Set(m.map((x) => x.group))
    expect(groups.has('unit')).toBe(true)
    expect(groups.has('width')).toBe(true)
    expect(groups.has('length')).toBe(true)
    expect(m.find((x) => x.key === 'headUnit')!.cm).toBeCloseTo(175 / 7.5, 6)
  })

  it('todos los largos escalan linealmente con la altura', () => {
    const a = buildMeasurements(buildFigure({ heightCm: 150 }))
    const b = buildMeasurements(buildFigure({ heightCm: 300 }))
    for (const ma of a.filter((x) => x.group === 'length')) {
      const mb = b.find((x) => x.key === ma.key)!
      expect(mb.cm).toBeCloseTo(ma.cm * 2, 6)
    }
  })

  it('ancho de hombros en cabezas coincide con el canon', () => {
    const m = buildMeasurements(buildFigure({ canonId: 'heroic', heightCm: 175 }))
    // heroic.widths.shoulders = 2.0
    expect(m.find((x) => x.key === 'shouldersW')!.heads).toBeCloseTo(2, 4)
  })

  it('cm = heads · headCm para cada medida', () => {
    const fig = buildFigure({ heightCm: 180 })
    const m = buildMeasurements(fig)
    for (const x of m) expect(x.cm).toBeCloseTo(x.heads * fig.headCm, 4)
  })

  it('anchos/largos traen ref y desviación = canon − centro del rango', () => {
    const m = buildMeasurements(buildFigure({ canonId: 'heroic', heightCm: 175 }))
    for (const x of m.filter((y) => y.group !== 'unit')) {
      expect(x.ref).toBeDefined()
      const mid = (x.ref!.min + x.ref!.max) / 2
      expect(x.deviation).toBeCloseTo(x.heads - mid, 6)
    }
    // unit (altura/cabeza) no tiene referencia anatómica
    expect(m.find((x) => x.key === 'headUnit')!.ref).toBeUndefined()
  })

  it('pantorrilla canónica (1.70) cae fuera del rango anatómico (1.50–1.60)', () => {
    const m = buildMeasurements(buildFigure({ canonId: 'heroic', heightCm: 175 }))
    const shin = m.find((x) => x.key === 'shin')!
    expect(withinRef(shin.heads, shin.ref!)).toBe(false)
    expect(shin.deviation).toBeCloseTo(1.7 - ANATOMY_REFERENCE.shin.min - 0.05, 6) // 1.70 - 1.55
  })
})
