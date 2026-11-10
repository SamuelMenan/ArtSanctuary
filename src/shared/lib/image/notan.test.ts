import { describe, expect, it } from 'vitest'
import {
  NOTAN_BLACK,
  NOTAN_MAX_DIM,
  NOTAN_MID_BAND,
  NOTAN_MID_GRAY,
  NOTAN_WHITE,
  applyNotan,
  clampThreshold,
  computeLuminance,
  fitWithin,
  luminance,
  notanFileName,
  notanTone,
  type NotanOptions,
} from './notan'

/** Construye un buffer RGBA a partir de [r, g, b, a] por píxel. */
function rgba(pixels: [number, number, number, number][]): Uint8ClampedArray {
  return new Uint8ClampedArray(pixels.flat())
}

/** Gradiente de grises 0..255 opaco (256 píxeles). */
function grayRamp(): Uint8ClampedArray {
  return rgba(Array.from({ length: 256 }, (_, v) => [v, v, v, 255] as [number, number, number, number]))
}

function run(source: Uint8ClampedArray, options: NotanOptions): Uint8ClampedArray {
  const out = new Uint8ClampedArray(source.length)
  applyNotan(computeLuminance(source), source, out, options)
  return out
}

/** Valores RGB distintos presentes en el resultado. */
function tones(out: Uint8ClampedArray): Set<number> {
  const s = new Set<number>()
  for (let i = 0; i < out.length; i += 4) {
    expect(out[i]).toBe(out[i + 1])
    expect(out[i]).toBe(out[i + 2])
    s.add(out[i])
  }
  return s
}

describe('luminance', () => {
  it('uses Rec. 601 weights', () => {
    expect(luminance(255, 0, 0)).toBeCloseTo(76.245)
    expect(luminance(0, 255, 0)).toBeCloseTo(149.685)
    expect(luminance(0, 0, 255)).toBeCloseTo(29.07)
  })

  it('gives exactly 0 for black and 255 for pure white', () => {
    expect(luminance(0, 0, 0)).toBe(0)
    expect(luminance(255, 255, 255)).toBe(255)
  })

  it('computes one value per pixel and rejects malformed buffers', () => {
    const lum = computeLuminance(rgba([[255, 255, 255, 255], [0, 0, 0, 255]]))
    expect(Array.from(lum)).toEqual([255, 0])
    expect(() => computeLuminance(new Uint8ClampedArray(5))).toThrow(RangeError)
  })
})

describe('2-value mode', () => {
  it('produces only black and white', () => {
    const out = run(grayRamp(), { threshold: 128, mode: 2 })
    expect(tones(out)).toEqual(new Set([NOTAN_BLACK, NOTAN_WHITE]))
  })

  it('splits at the threshold: L < U is black, L ≥ U is white', () => {
    expect(notanTone(127, { threshold: 128, mode: 2 })).toBe(NOTAN_BLACK)
    expect(notanTone(128, { threshold: 128, mode: 2 })).toBe(NOTAN_WHITE)
  })

  it('threshold 0 turns everything white', () => {
    const out = run(grayRamp(), { threshold: 0, mode: 2 })
    expect(tones(out)).toEqual(new Set([NOTAN_WHITE]))
  })

  it('threshold 255 turns everything black except pure white', () => {
    const out = run(grayRamp(), { threshold: 255, mode: 2 })
    // 255 píxeles negros + el último (255,255,255) blanco.
    expect(out[254 * 4]).toBe(NOTAN_BLACK)
    expect(out[255 * 4]).toBe(NOTAN_WHITE)
    expect(tones(out)).toEqual(new Set([NOTAN_BLACK, NOTAN_WHITE]))
  })

  it('works on color images (luminance, not a single channel)', () => {
    // Rojo puro: L ≈ 76 → negro con U=128; verde puro: L ≈ 150 → blanco.
    const out = run(rgba([[255, 0, 0, 255], [0, 255, 0, 255]]), { threshold: 128, mode: 2 })
    expect(out[0]).toBe(NOTAN_BLACK)
    expect(out[4]).toBe(NOTAN_WHITE)
  })
})

describe('3-value mode', () => {
  it('produces only black, mid gray and white', () => {
    const out = run(grayRamp(), { threshold: 128, mode: 3 })
    expect(tones(out)).toEqual(new Set([NOTAN_BLACK, NOTAN_MID_GRAY, NOTAN_WHITE]))
  })

  it('uses the threshold as the center of the gray band', () => {
    const o = { threshold: 128, mode: 3 } as const
    expect(notanTone(128 - NOTAN_MID_BAND - 1, o)).toBe(NOTAN_BLACK)
    expect(notanTone(128 - NOTAN_MID_BAND, o)).toBe(NOTAN_MID_GRAY)
    expect(notanTone(128, o)).toBe(NOTAN_MID_GRAY)
    expect(notanTone(128 + NOTAN_MID_BAND - 1, o)).toBe(NOTAN_MID_GRAY)
    expect(notanTone(128 + NOTAN_MID_BAND, o)).toBe(NOTAN_WHITE)
  })

  it('threshold 0 has no black, threshold 255 has no white', () => {
    expect(tones(run(grayRamp(), { threshold: 0, mode: 3 }))).toEqual(new Set([NOTAN_MID_GRAY, NOTAN_WHITE]))
    expect(tones(run(grayRamp(), { threshold: 255, mode: 3 }))).toEqual(new Set([NOTAN_BLACK, NOTAN_MID_GRAY]))
  })
})

describe('threshold and mode changes', () => {
  it('a different threshold changes the result in both modes', () => {
    for (const mode of [2, 3] as const) {
      const low = run(grayRamp(), { threshold: 60, mode })
      const high = run(grayRamp(), { threshold: 200, mode })
      expect(Array.from(low)).not.toEqual(Array.from(high))
    }
  })

  it('switching 2 → 3 → 2 gives back the same 2-value result', () => {
    const src = grayRamp()
    const lum = computeLuminance(src)
    const out = new Uint8ClampedArray(src.length)
    applyNotan(lum, src, out, { threshold: 100, mode: 2 })
    const first = Array.from(out)
    applyNotan(lum, src, out, { threshold: 100, mode: 3 })
    expect(tones(out).has(NOTAN_MID_GRAY)).toBe(true)
    applyNotan(lum, src, out, { threshold: 100, mode: 2 })
    expect(Array.from(out)).toEqual(first)
  })
})

describe('applyNotan safety', () => {
  it('keeps the original alpha channel', () => {
    const src = rgba([[10, 10, 10, 0], [200, 200, 200, 128], [90, 90, 90, 255]])
    const out = run(src, { threshold: 128, mode: 3 })
    expect([out[3], out[7], out[11]]).toEqual([0, 128, 255])
  })

  it('does not mutate the source pixels or the luminance', () => {
    const src = grayRamp()
    const before = Array.from(src)
    const lum = computeLuminance(src)
    const lumBefore = Array.from(lum)
    applyNotan(lum, src, new Uint8ClampedArray(src.length), { threshold: 128, mode: 3 })
    expect(Array.from(src)).toEqual(before)
    expect(Array.from(lum)).toEqual(lumBefore)
  })

  it('rejects invalid thresholds, modes and buffer sizes', () => {
    const src = grayRamp()
    const lum = computeLuminance(src)
    const out = new Uint8ClampedArray(src.length)
    expect(() => applyNotan(lum, src, out, { threshold: -1, mode: 2 })).toThrow(RangeError)
    expect(() => applyNotan(lum, src, out, { threshold: 256, mode: 2 })).toThrow(RangeError)
    expect(() => applyNotan(lum, src, out, { threshold: 12.5, mode: 2 })).toThrow(RangeError)
    expect(() => applyNotan(lum, src, out, { threshold: 128, mode: 4 as 2 })).toThrow(RangeError)
    expect(() => applyNotan(lum, src, new Uint8ClampedArray(8), { threshold: 128, mode: 2 })).toThrow(RangeError)
  })
})

describe('helpers', () => {
  it('clampThreshold keeps 0–255 integers and rejects NaN', () => {
    expect(clampThreshold(-10)).toBe(0)
    expect(clampThreshold(300)).toBe(255)
    expect(clampThreshold(127.6)).toBe(128)
    expect(() => clampThreshold(Number.NaN)).toThrow(RangeError)
  })

  it('fitWithin keeps small images and scales the long side of big ones', () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600, scaled: false })
    expect(fitWithin(4096, 2048)).toEqual({ width: NOTAN_MAX_DIM, height: 1024, scaled: true })
    expect(fitWithin(1000, 6000, 2048)).toEqual({ width: 341, height: 2048, scaled: true })
    expect(() => fitWithin(0, 10)).toThrow(RangeError)
  })

  it('names the download after the mode and threshold', () => {
    expect(notanFileName({ mode: 2, threshold: 128 })).toBe('notan-2-valores-umbral-128.png')
    expect(notanFileName({ mode: 3, threshold: 40 })).toBe('notan-3-valores-umbral-40.png')
  })
})
