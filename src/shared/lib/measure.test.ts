// Unit tests for the exact global measurement scale (215/14 = 430/28).
// Run with: npm test  (Vitest). Imports are relative to avoid alias config.
import { describe, it, expect } from 'vitest'
import {
  SCALE_RATIO_NUM,
  SCALE_RATIO_DEN,
  applyScale,
  formatScaled,
  formatCm,
} from './measure'

describe('escala global exacta (215/14)', () => {
  it('mantiene la fracción exacta 215/14 = 430/28', () => {
    expect(SCALE_RATIO_NUM).toBe(215)
    expect(SCALE_RATIO_DEN).toBe(14)
    // La fracción reduce a partir de 430/28.
    expect(430 / 28).toBe(SCALE_RATIO_NUM / SCALE_RATIO_DEN)
  })

  it('28 cm → 430 cm exacto', () => {
    expect(applyScale(28)).toBe(430)
  })

  it('2 cm → 430/14 cm (30.714285…)', () => {
    expect(applyScale(2)).toBe(430 / 14)
    // sanity numérico del valor decimal esperado
    expect(applyScale(2)).toBeCloseTo(30.714285714285715, 12)
  })
})

describe('formatScaled (Final: cm escalados + metros cuando ≥ 100 cm)', () => {
  it('28 cm → "430 cm (4.3 m)"', () => {
    expect(formatScaled(28)).toBe('430 cm (4.3 m)')
  })

  it('2 cm → "30.71 cm" (sin metros, < 100 cm escalado)', () => {
    expect(formatScaled(2)).toBe('30.71 cm')
  })

  it('muestra metros entre paréntesis solo cuando el valor escalado ≥ 100 cm', () => {
    // 7 cm * 215/14 = 107.5 cm ≥ 100 → incluye metros.
    // 1.075 se almacena como 1.0749…, así toFixed(2) da "1.07" (no "1.08").
    expect(formatScaled(7)).toBe('107.5 cm (1.07 m)')
    expect(formatScaled(7)).toMatch(/\(\d+(\.\d+)? m\)$/)
    // valor pequeño no incluye metros
    expect(formatScaled(2)).not.toMatch(/m\)/)
  })

  it('recorta ceros: cm y m con 2 decimales, sin ceros finales', () => {
    // 28 → 430.00 cm → "430 cm", 4.30 m → "4.3 m"
    expect(formatScaled(28)).toBe('430 cm (4.3 m)')
  })
})

describe('formatCm (Referencia: solo cm, nunca metros)', () => {
  it('formatea cm crudos sin aplicar escala', () => {
    expect(formatCm(28)).toBe('28 cm')
    expect(formatCm(16)).toBe('16 cm')
  })

  it('nunca añade metros aunque el valor sea grande', () => {
    expect(formatCm(430)).toBe('430 cm')
    expect(formatCm(430)).not.toMatch(/m\)/)
  })

  it('Referencia sin metros vs Final con metros para el mismo objeto', () => {
    const cm = 28
    expect(formatCm(cm)).not.toMatch(/m\)/) // Referencia
    expect(formatScaled(cm)).toMatch(/m\)/) // Final
  })

  it('cm con 2 decimales y trim de ceros', () => {
    expect(formatCm(30.7)).toBe('30.7 cm')
    expect(formatCm(30.714285)).toBe('30.71 cm')
    expect(formatCm(30.0)).toBe('30 cm')
  })
})
