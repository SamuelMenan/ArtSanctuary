import { describe, it, expect } from 'vitest'
import { convert, formatValue } from './units'

describe('units', () => {
  it('cm devuelve el mismo valor', () => {
    expect(convert(100, 'cm', 20)).toBe(100)
  })

  it('in = cm / 2.54', () => {
    expect(convert(2.54, 'in', 20)).toBeCloseTo(1, 6)
  })

  it('heads = cm / headCm', () => {
    expect(convert(60, 'heads', 20)).toBeCloseTo(3, 6)
  })

  it('headCm 0 no rompe (heads = 0)', () => {
    expect(convert(60, 'heads', 0)).toBe(0)
  })

  it('formatValue: heads con 2 decimales, resto con 1', () => {
    expect(formatValue(60, 'heads', 20)).toBe('3.00')
    expect(formatValue(2.54, 'in', 20)).toBe('1.0')
    expect(formatValue(100, 'cm', 20)).toBe('100.0')
  })
})
