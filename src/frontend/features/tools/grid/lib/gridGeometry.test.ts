// Tests de geometría de cuadrícula + colLabel. Imports relativos (sin alias).
import { describe, it, expect } from 'vitest'
import { computeGridGeometry, snapToSquare } from './gridGeometry'
import { colLabel } from './colLabel'
import { applyScale } from '../../../../../shared/lib/measure'

const base = {
  realWidthCm: 15,
  squareCm: 1.5,
  imgNatural: { w: 4, h: 3 },
  stage: { w: 920, h: 600 },
  opacity: 30,
  color: '#ffffff',
}

describe('colLabel', () => {
  it('mapea índices a etiquetas estilo hoja de cálculo', () => {
    expect(colLabel(0)).toBe('A')
    expect(colLabel(25)).toBe('Z')
    expect(colLabel(26)).toBe('AA')
    expect(colLabel(27)).toBe('AB')
    expect(colLabel(51)).toBe('AZ')
    expect(colLabel(52)).toBe('BA')
  })
})

describe('snapToSquare', () => {
  it('ajusta al múltiplo del cuadro más cercano', () => {
    expect(snapToSquare(15, 1.5)).toBe(15)
    expect(snapToSquare(15.4, 1.5)).toBe(15)
    expect(snapToSquare(16, 1.5)).toBe(16.5)
  })
  it('nunca baja de un cuadro', () => {
    expect(snapToSquare(0, 1.5)).toBe(1.5)
    expect(snapToSquare(-5, 2)).toBe(2)
  })
})

describe('computeGridGeometry', () => {
  it('cols = ancho real ÷ cuadro (redondeado), ≥ 1', () => {
    expect(computeGridGeometry(base).cols).toBe(10) // 15 / 1.5
  })

  it('rows desde el aspecto de la imagen y el ancho efectivo', () => {
    // aspect = 3/4 = 0.75; effWidth = 10*1.5 = 15; realHeight = 15*0.75 = 11.25; rows = round(11.25/1.5)=8 (7.5→8)
    const g = computeGridGeometry(base)
    expect(g.effWidthCm).toBe(15)
    expect(g.rows).toBe(8)
  })

  it('targetCm = applyScale(squareCm) y factor coherente', () => {
    const g = computeGridGeometry(base)
    expect(g.targetCm).toBe(applyScale(1.5))
    expect(g.factor).toBeCloseTo(g.targetCm / 1.5, 10)
  })

  it('refW/refH = nº cuadros × tamaño de cuadro', () => {
    const g = computeGridGeometry(base)
    expect(g.refW).toBe(g.cols * 1.5)
    expect(g.refH).toBe(g.rows * 1.5)
  })

  it('encaja el marco con celdas cuadradas (frameW/cols == frameH/rows)', () => {
    const g = computeGridGeometry(base)
    expect(g.frameW / g.cols).toBeCloseTo(g.frameH / g.rows, 10)
  })

  it('backgroundSize reparte el % entre columnas y filas', () => {
    const g = computeGridGeometry(base)
    expect(g.gridStyle.backgroundSize).toBe(`${100 / g.cols}% ${100 / g.rows}%`)
  })

  it('escenario sin tamaño ⇒ marco colapsado a 0', () => {
    const g = computeGridGeometry({ ...base, stage: { w: 0, h: 0 } })
    expect(g.frameW).toBe(0)
    expect(g.frameH).toBe(0)
  })
})
