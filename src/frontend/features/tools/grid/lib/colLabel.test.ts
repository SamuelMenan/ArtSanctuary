import { describe, it, expect } from 'vitest'
import { colLabel } from './colLabel'

describe('colLabel', () => {
  it('primera columna y límites de una letra', () => {
    expect(colLabel(0)).toBe('A')
    expect(colLabel(25)).toBe('Z')
  })

  it('salta a dos letras al pasar Z', () => {
    expect(colLabel(26)).toBe('AA')
    expect(colLabel(27)).toBe('AB')
    expect(colLabel(51)).toBe('AZ')
    expect(colLabel(52)).toBe('BA')
  })

  it('límite de dos letras y salto a tres', () => {
    expect(colLabel(701)).toBe('ZZ')
    expect(colLabel(702)).toBe('AAA')
  })
})
