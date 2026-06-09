import { describe, it, expect } from 'vitest'
import { getLandmarks, landmarkPositionsCm, segmentLengthsCm } from './landmarks'

// Fidelidad (P10): lo que el panel muestra debe ser la geometría REAL medida del
// dibujo · escala — idéntico a lo que mide la regla. Si pones 20 cm y replicas,
// sale exacto. Estos tests verifican esa exactitud y la invariancia de escala.
describe('landmarks — fidelidad de medidas reales', () => {
  it('posición = frac · heightCm (misma fuente que la regla)', () => {
    const h = 175
    for (const p of landmarkPositionsCm('heroic', h)) {
      expect(p.cm).toBeCloseTo(p.frac * h, 9)
    }
  })

  it('escala lineal exacta: replicar a otra altura mantiene la proporción', () => {
    const a = landmarkPositionsCm('heroic', 20)
    const b = landmarkPositionsCm('heroic', 200)
    for (let i = 0; i < a.length; i++) {
      expect(b[i].cm).toBeCloseTo(a[i].cm * 10, 9) // ×10 altura → ×10 cm
    }
  })

  it('los segmentos suman la distancia coronilla→último landmark', () => {
    const h = 180
    const pos = landmarkPositionsCm('heroic', h)
    const segs = segmentLengthsCm('heroic', h)
    const sum = segs.reduce((a, s) => a + s.cm, 0)
    expect(sum).toBeCloseTo(pos[pos.length - 1].cm - pos[0].cm, 9)
  })

  it('cada landmark tiene su posición (sin perder ninguno)', () => {
    expect(landmarkPositionsCm('heroic', 175).length).toBe(getLandmarks('heroic').length)
  })
})
