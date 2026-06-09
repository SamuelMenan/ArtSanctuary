import { describe, it, expect } from 'vitest'
import { BODY_PARTS, allParts, partTree, getPart, dimHeads, dimCm } from './anatomyParts'

describe('anatomyParts (atlas)', () => {
  it('cada parte (incl. sub-partes) tiene clave única y al menos una dimensión', () => {
    const keys = allParts().map((p) => p.key)
    expect(new Set(keys).size).toBe(keys.length)
    for (const p of allParts()) expect(p.dims.length).toBeGreaterThan(0)
  })

  it('toda dimensión (en todo el árbol) lleva procedencia (regla dura)', () => {
    for (const p of allParts()) {
      for (const d of p.dims) expect(d.source).toBeTruthy()
    }
  })

  it('toda dimensión resuelve a cabezas (heads o relativeTo válido)', () => {
    for (const p of allParts()) {
      for (const d of p.dims) {
        expect(dimHeads(p, d), `${p.key}.${d.key}`).not.toBeNull()
        expect(dimHeads(p, d)!).toBeGreaterThan(0)
      }
    }
  })

  it('relativeTo apunta a una dimensión existente de la misma parte', () => {
    for (const p of allParts()) {
      for (const d of p.dims) {
        if (d.relativeTo) {
          expect(p.dims.some((x) => x.key === d.relativeTo), `${p.key}.${d.key}→${d.relativeTo}`).toBe(true)
          expect(d.ratio).toBeDefined()
        }
      }
    }
  })

  it('partTree agrupa las raíces por región sin perder ninguna', () => {
    const inTree = partTree().flatMap((g) => g.parts)
    expect(inTree.length).toBe(BODY_PARTS.length)
    expect(new Set(inTree)).toEqual(new Set(BODY_PARTS))
  })

  it('la mano tiene sub-partes palma y dedo medio ≈ ½ mano', () => {
    const hand = getPart('hand')!
    const handLen = dimHeads(hand, hand.dims.find((d) => d.key === 'length')!)!
    const palm = getPart('palm')!
    const middle = getPart('middleFinger')!
    expect(dimHeads(palm, palm.dims[0])).toBeCloseTo(handLen * 0.5, 6)
    expect(dimHeads(middle, middle.dims[0])).toBeCloseTo(handLen * 0.5, 6)
  })

  it('dimCm escala lineal con headCm', () => {
    const foot = getPart('foot')!
    const len = foot.dims.find((d) => d.key === 'length')!
    expect(dimCm(foot, len, 20)).toBeCloseTo(dimHeads(foot, len)! * 20, 6)
    expect(dimCm(foot, len, 40)).toBeCloseTo((dimCm(foot, len, 20) as number) * 2, 6)
  })
})
