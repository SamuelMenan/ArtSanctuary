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

  it('el atlas ampliado tiene las 17 raíces (incl. trapecio/hombro/codo/muñeca/glúteo/rodilla/tobillo)', () => {
    const keys = BODY_PARTS.map((p) => p.key)
    expect(keys.length).toBe(17)
    for (const k of ['trapezius', 'shoulder', 'elbow', 'wrist', 'gluteus', 'knee', 'ankle']) {
      expect(keys, k).toContain(k)
    }
  })

  it('la mano tiene palma + 5 dedos; palma y dedo medio ≈ ½ mano', () => {
    const hand = getPart('hand')!
    const handLen = dimHeads(hand, hand.dims.find((d) => d.key === 'length')!)!
    expect(hand.children!.map((c) => c.key)).toEqual([
      'palm', 'thumb', 'indexFinger', 'middleFinger', 'ringFinger', 'littleFinger',
    ])
    expect(dimHeads(getPart('palm')!, getPart('palm')!.dims[0])).toBeCloseTo(handLen * 0.5, 6)
    expect(dimHeads(getPart('middleFinger')!, getPart('middleFinger')!.dims[0])).toBeCloseTo(handLen * 0.5, 6)
  })

  it('cada dedo de la mano tiene falanges decrecientes (pulgar 2, resto 3)', () => {
    for (const fk of ['thumb', 'indexFinger', 'middleFinger', 'ringFinger', 'littleFinger']) {
      const f = getPart(fk)!
      const phal = f.children!
      expect(phal.length).toBe(fk === 'thumb' ? 2 : 3)
      const lens = phal.map((p) => dimHeads(p, p.dims[0])!)
      for (let i = 1; i < lens.length; i++) expect(lens[i - 1], `${fk}`).toBeGreaterThan(lens[i])
    }
  })

  it('falanges del dedo medio suman ≈ su largo', () => {
    const middle = getPart('middleFinger')!
    const sum = middle.children!.reduce((a, p) => a + dimHeads(p, p.dims[0])!, 0)
    expect(sum).toBeCloseTo(dimHeads(middle, middle.dims[0])!, 1)
  })

  it('el pie tiene 5 dedos decrecientes del gordo al pequeño', () => {
    const foot = getPart('foot')!
    const lens = foot.children!.map((t) => dimHeads(t, t.dims[0])!)
    expect(lens.length).toBe(5)
    for (let i = 1; i < lens.length; i++) expect(lens[i - 1]).toBeGreaterThan(lens[i])
  })

  it('la cabeza tiene rasgos faciales (ojo/nariz/oreja/boca)', () => {
    expect(getPart('head')!.children!.map((c) => c.key)).toEqual(['eye', 'nose', 'ear', 'mouth'])
  })

  it('dimCm escala lineal con headCm', () => {
    const foot = getPart('foot')!
    const len = foot.dims.find((d) => d.key === 'length')!
    expect(dimCm(foot, len, 20)).toBeCloseTo(dimHeads(foot, len)! * 20, 6)
    expect(dimCm(foot, len, 40)).toBeCloseTo((dimCm(foot, len, 20) as number) * 2, 6)
  })
})
