import { describe, it, expect } from 'vitest'
import { humanFigureSizeCm, humanFigureSvgDataUrl, FEET_TO_SHOULDER_RATIO } from './humanFigure'

describe('figura humana reglamentaria', () => {
  it('pies→hombros = 15 cm fija la altura total de la silueta', () => {
    const { hCm } = humanFigureSizeCm(15)
    // pies→hombros = 0.84 de la altura total → total = 15 / 0.84
    expect(hCm).toBeCloseTo(15 / FEET_TO_SHOULDER_RATIO, 5)
    // El tramo hombros real reconstruido vuelve a 15.
    expect(hCm * FEET_TO_SHOULDER_RATIO).toBeCloseTo(15, 5)
  })

  it('mantiene la proporción 200:750 del viewBox', () => {
    const { wCm, hCm } = humanFigureSizeCm(15)
    expect(wCm / hCm).toBeCloseTo(200 / 750, 5)
  })

  it('genera un data-URL SVG con la cota de hombros', () => {
    const url = humanFigureSvgDataUrl(15)
    expect(url.startsWith('data:image/svg+xml')).toBe(true)
    expect(decodeURIComponent(url)).toContain('15 cm')
  })
})
