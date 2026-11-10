import { describe, it, expect } from 'vitest'
import { humanPlateFor, shoulderFrac, CARNAVAL_CANON_ID } from './carnavalHumanPlate'
import { figureDims } from '@shared/lib/canon/plates'

describe('figura humana reglamentaria (lámina de Canon)', () => {
  it('planta→hombros = 15 cm fija la altura total de la lámina', () => {
    const p = humanPlateFor('frontal', 15)!
    // Hombros al 16% desde la coronilla → planta→hombros es el 84% restante.
    expect(p.hCm).toBeCloseTo(15 / (1 - shoulderFrac()), 5)
    // El tramo de hombros reconstruido vuelve a 15.
    expect(p.hCm * (1 - shoulderFrac())).toBeCloseTo(15, 5)
  })

  it('cada plano usa su perspectiva y conserva la proporción de su lámina', () => {
    for (const [plano, view] of [
      ['frontal', 'frontal'],
      ['posterior', 'posterior'],
      ['lateralDer', 'lateral'],
      ['lateralIzq', 'lateral'],
    ] as const) {
      const p = humanPlateFor(plano, 15)!
      const d = figureDims(CARNAVAL_CANON_ID, view)
      expect(p.src).toBe(`/canon/${CARNAVAL_CANON_ID}/${view}.png`)
      expect(p.wCm / p.hCm).toBeCloseTo(d.w / d.h, 5)
    }
  })

  it('las 4 vistas de alzado comparten altura (solo cambia el ancho)', () => {
    const alturas = (['frontal', 'posterior', 'lateralDer', 'lateralIzq'] as const).map(
      (v) => humanPlateFor(v, 15)!.hCm,
    )
    for (const h of alturas) expect(h).toBeCloseTo(alturas[0], 5)
  })

  it('solo el lateral izquierdo se espeja', () => {
    expect(humanPlateFor('lateralIzq', 15)!.flipX).toBe(true)
    expect(humanPlateFor('lateralDer', 15)!.flipX).toBe(false)
    expect(humanPlateFor('frontal', 15)!.flipX).toBe(false)
  })

  it('sin lámina en planta ni en planos especiales', () => {
    expect(humanPlateFor('superior', 15)).toBeNull()
    expect(humanPlateFor('bastidores', 15)).toBeNull()
    expect(humanPlateFor('jugadores', 15)).toBeNull()
  })

  it('escala lineal con la referencia de hombros', () => {
    const a = humanPlateFor('frontal', 15)!
    const b = humanPlateFor('frontal', 30)!
    expect(b.hCm).toBeCloseTo(a.hCm * 2, 5)
    expect(b.wCm).toBeCloseTo(a.wCm * 2, 5)
  })
})
