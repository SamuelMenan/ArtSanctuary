import { describe, it, expect } from 'vitest'
import {
  hexToRgb, rgbToHex, rgbToCmyk, cmykToRgb, rgbToHsl, mixColors, isMuddy,
} from './colorMix'

describe('hexToRgb', () => {
  it('parsea 6 dígitos', () => {
    expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 })
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 })
    expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 })
  })
  it('acepta atajo de 3 dígitos y sin #', () => {
    expect(hexToRgb('#F00')).toEqual({ r: 255, g: 0, b: 0 })
    expect(hexToRgb('00FF00')).toEqual({ r: 0, g: 255, b: 0 })
  })
})

describe('rgbToHex', () => {
  it('formatea en mayúsculas con #', () => {
    expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#FFFFFF')
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000')
  })
  it('clampa y redondea fuera de rango', () => {
    expect(rgbToHex({ r: 300, g: -10, b: 127.6 })).toBe('#FF0080')
  })
  it('round-trip hex → rgb → hex', () => {
    for (const hex of ['#1A2B3C', '#ABCDEF', '#FF8800']) {
      expect(rgbToHex(hexToRgb(hex))).toBe(hex)
    }
  })
})

describe('rgbToCmyk / cmykToRgb', () => {
  it('blanco y negro', () => {
    expect(rgbToCmyk({ r: 255, g: 255, b: 255 })).toEqual({ c: 0, m: 0, y: 0, k: 0 })
    expect(rgbToCmyk({ r: 0, g: 0, b: 0 })).toEqual({ c: 0, m: 0, y: 0, k: 100 })
  })
  it('rojo puro', () => {
    expect(rgbToCmyk({ r: 255, g: 0, b: 0 })).toEqual({ c: 0, m: 100, y: 100, k: 0 })
  })
  it('cmykToRgb inverso en extremos', () => {
    expect(cmykToRgb({ c: 0, m: 0, y: 0, k: 0 })).toEqual({ r: 255, g: 255, b: 255 })
    expect(cmykToRgb({ c: 0, m: 0, y: 0, k: 100 })).toEqual({ r: 0, g: 0, b: 0 })
  })
})

describe('rgbToHsl', () => {
  it('grises tienen saturación 0', () => {
    expect(rgbToHsl({ r: 255, g: 255, b: 255 })).toEqual({ h: 0, s: 0, l: 100 })
    expect(rgbToHsl({ r: 0, g: 0, b: 0 })).toEqual({ h: 0, s: 0, l: 0 })
  })
  it('rojo puro', () => {
    expect(rgbToHsl({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, l: 50 })
  })
})

describe('mixColors', () => {
  it('vacío → blanco; un pigmento → su color', () => {
    expect(mixColors([], 'additive-rgb')).toEqual({ r: 255, g: 255, b: 255 })
    expect(mixColors([{ hex: '#FF0000', weight: 1 }], 'cmyk')).toEqual({ r: 255, g: 0, b: 0 })
  })
  it('aditivo: negro + blanco a partes iguales → gris medio', () => {
    const mix = mixColors([
      { hex: '#000000', weight: 1 },
      { hex: '#FFFFFF', weight: 1 },
    ], 'additive-rgb')
    expect(mix.r).toBeCloseTo(127.5)
    expect(mix.g).toBeCloseTo(127.5)
    expect(mix.b).toBeCloseTo(127.5)
  })
  it('layer-opaque: gana el de mayor peso', () => {
    const mix = mixColors([
      { hex: '#FF0000', weight: 1 },
      { hex: '#0000FF', weight: 5 },
    ], 'layer-opaque')
    expect(mix).toEqual({ r: 0, g: 0, b: 255 })
  })
})

describe('isMuddy', () => {
  it('gris medio es turbio', () => {
    expect(isMuddy({ r: 128, g: 128, b: 128 })).toBe(true)
  })
  it('color saturado no es turbio', () => {
    expect(isMuddy({ r: 255, g: 0, b: 0 })).toBe(false)
  })
})
