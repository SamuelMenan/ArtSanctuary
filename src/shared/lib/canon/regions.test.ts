import { describe, it, expect } from 'vitest'
import { SURFACE_REGIONS, getRegion } from './regions'
import { getPart } from './anatomyParts'

describe('regions (zonas de superficie clicables sin dim)', () => {
  it('cada región-zona tiene clave única, región válida y fuente', () => {
    const keys = SURFACE_REGIONS.map((r) => r.key)
    expect(new Set(keys).size).toBe(keys.length)
    for (const r of SURFACE_REGIONS) {
      expect(['head', 'trunk', 'arm', 'leg']).toContain(r.region)
      expect(r.source).toBeTruthy()
    }
  })

  it('NINGUNA región-zona colisiona con una parte-con-dim del atlas (son disjuntas)', () => {
    for (const r of SURFACE_REGIONS) {
      expect(getPart(r.key), `${r.key} no debe ser parte-atlas`).toBeUndefined()
    }
  })

  it('getRegion resuelve las zonas y devuelve undefined para partes-atlas', () => {
    expect(getRegion('lumbar')?.region).toBe('trunk')
    expect(getRegion('popliteal')?.region).toBe('leg')
    expect(getRegion('hand')).toBeUndefined() // hand es parte-con-dim, no zona
    expect(getRegion('xxx')).toBeUndefined()
  })
})
