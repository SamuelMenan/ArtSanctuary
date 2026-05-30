export type MixModel = 'subtractive-ryb' | 'cmyk' | 'additive-rgb' | 'kubelka-munk' | 'layer-opaque'

export type RGB = { r: number; g: number; b: number }
export type CMYK = { c: number; m: number; y: number; k: number }
export type HSL = { h: number; s: number; l: number }
export type LAB = { l: number; a: number; b: number }

export type Pigment = { hex: string; weight: number }

export function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '')
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(v, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export function rgbToHex({ r, g, b }: RGB): string {
  const c = (x: number) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase()
}

export function rgbToCmyk({ r, g, b }: RGB): CMYK {
  const rf = r / 255, gf = g / 255, bf = b / 255
  const k = 1 - Math.max(rf, gf, bf)
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 }
  const c = (1 - rf - k) / (1 - k)
  const m = (1 - gf - k) / (1 - k)
  const y = (1 - bf - k) / (1 - k)
  return { c: Math.round(c * 100), m: Math.round(m * 100), y: Math.round(y * 100), k: Math.round(k * 100) }
}

export function cmykToRgb({ c, m, y, k }: CMYK): RGB {
  const cf = c / 100, mf = m / 100, yf = y / 100, kf = k / 100
  return {
    r: 255 * (1 - cf) * (1 - kf),
    g: 255 * (1 - mf) * (1 - kf),
    b: 255 * (1 - yf) * (1 - kf),
  }
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const rf = r / 255, gf = g / 255, bf = b / 255
  const max = Math.max(rf, gf, bf), min = Math.min(rf, gf, bf)
  const l = (max + min) / 2
  let h = 0, s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === rf) h = ((gf - bf) / d + (gf < bf ? 6 : 0))
    else if (max === gf) h = (bf - rf) / d + 2
    else h = (rf - gf) / d + 4
    h *= 60
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function rgbToXyz({ r, g, b }: RGB) {
  const f = (v: number) => {
    const x = v / 255
    return x > 0.04045 ? Math.pow((x + 0.055) / 1.055, 2.4) : x / 12.92
  }
  const R = f(r), G = f(g), B = f(b)
  return {
    x: (R * 0.4124 + G * 0.3576 + B * 0.1805) * 100,
    y: (R * 0.2126 + G * 0.7152 + B * 0.0722) * 100,
    z: (R * 0.0193 + G * 0.1192 + B * 0.9505) * 100,
  }
}

export function rgbToLab(rgb: RGB): LAB {
  const { x, y, z } = rgbToXyz(rgb)
  const xn = x / 95.047, yn = y / 100, zn = z / 108.883
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  const fx = f(xn), fy = f(yn), fz = f(zn)
  return {
    l: Math.round(116 * fy - 16),
    a: Math.round(500 * (fx - fy)),
    b: Math.round(200 * (fy - fz)),
  }
}

// RYB subtractive — approximation via RGB→RYB→mix→RGB
function rgbToRyb({ r, g, b }: RGB) {
  const w = Math.min(r, g, b)
  let R = r - w, G = g - w, B = b - w
  const mg = Math.max(R, G, B)
  let Y = Math.min(R, G)
  R -= Y; G -= Y
  if (B > 0 && G > 0) { B /= 2; G /= 2 }
  Y += G; B += G
  const my = Math.max(R, Y, B)
  if (my > 0) {
    const n = mg / my
    R *= n; Y *= n; B *= n
  }
  R += w; Y += w; B += w
  return { r: R, y: Y, b: B }
}

function rybToRgb({ r, y, b }: { r: number; y: number; b: number }) {
  const w = Math.min(r, y, b)
  let R = r - w, Y = y - w, B = b - w
  const my = Math.max(R, Y, B)
  let G = Math.min(Y, B)
  Y -= G; B -= G
  if (B > 0 && G > 0) { B *= 2; G *= 2 }
  R += Y; G += Y
  const mg = Math.max(R, G, B)
  if (mg > 0) {
    const n = my / mg
    R *= n; G *= n; B *= n
  }
  R += w; G += w; B += w
  return { r: R, g: G, b: B }
}

function mixSubtractiveRyb(pigments: Pigment[]): RGB {
  const total = pigments.reduce((s, p) => s + p.weight, 0) || 1
  const acc = { r: 0, y: 0, b: 0 }
  for (const p of pigments) {
    const ryb = rgbToRyb(hexToRgb(p.hex))
    const w = p.weight / total
    acc.r += ryb.r * w
    acc.y += ryb.y * w
    acc.b += ryb.b * w
  }
  return rybToRgb(acc)
}

function mixCmyk(pigments: Pigment[]): RGB {
  const total = pigments.reduce((s, p) => s + p.weight, 0) || 1
  const acc = { c: 0, m: 0, y: 0, k: 0 }
  for (const p of pigments) {
    const cmyk = rgbToCmyk(hexToRgb(p.hex))
    const w = p.weight / total
    acc.c += cmyk.c * w
    acc.m += cmyk.m * w
    acc.y += cmyk.y * w
    acc.k += cmyk.k * w
  }
  return cmykToRgb(acc)
}

function mixAdditive(pigments: Pigment[]): RGB {
  const total = pigments.reduce((s, p) => s + p.weight, 0) || 1
  let r = 0, g = 0, b = 0
  for (const p of pigments) {
    const rgb = hexToRgb(p.hex)
    const w = p.weight / total
    r += rgb.r * w; g += rgb.g * w; b += rgb.b * w
  }
  return { r, g, b }
}

// Kubelka-Munk simplified via LAB weighted average — closer to perceptual
function mixKubelkaMunk(pigments: Pigment[]): RGB {
  const total = pigments.reduce((s, p) => s + p.weight, 0) || 1
  let l = 0, a = 0, b = 0
  for (const p of pigments) {
    const lab = rgbToLab(hexToRgb(p.hex))
    const w = p.weight / total
    l += lab.l * w; a += lab.a * w; b += lab.b * w
  }
  return labToRgb({ l, a, b })
}

function labToRgb({ l, a, b }: LAB): RGB {
  let y = (l + 16) / 116
  let x = a / 500 + y
  let z = y - b / 200
  const f = (t: number) => {
    const t3 = t * t * t
    return t3 > 0.008856 ? t3 : (t - 16 / 116) / 7.787
  }
  x = 95.047 * f(x); y = 100 * f(y); z = 108.883 * f(z)
  const xn = x / 100, yn = y / 100, zn = z / 100
  let R = xn * 3.2406 + yn * -1.5372 + zn * -0.4986
  let G = xn * -0.9689 + yn * 1.8758 + zn * 0.0415
  let B = xn * 0.0557 + yn * -0.2040 + zn * 1.0570
  const g = (v: number) => (v > 0.0031308 ? 1.055 * Math.pow(v, 1 / 2.4) - 0.055 : 12.92 * v)
  return {
    r: Math.max(0, Math.min(255, g(R) * 255)),
    g: Math.max(0, Math.min(255, g(G) * 255)),
    b: Math.max(0, Math.min(255, g(B) * 255)),
  }
}

// Layer opaque (vinyl): top layer wins, slight blend at edges
function mixLayerOpaque(pigments: Pigment[]): RGB {
  if (pigments.length === 0) return { r: 255, g: 255, b: 255 }
  const top = pigments.reduce((a, b) => (b.weight > a.weight ? b : a))
  return hexToRgb(top.hex)
}

export function mixColors(pigments: Pigment[], model: MixModel): RGB {
  if (pigments.length === 0) return { r: 255, g: 255, b: 255 }
  if (pigments.length === 1) return hexToRgb(pigments[0].hex)
  switch (model) {
    case 'subtractive-ryb': return mixSubtractiveRyb(pigments)
    case 'cmyk': return mixCmyk(pigments)
    case 'additive-rgb': return mixAdditive(pigments)
    case 'kubelka-munk': return mixKubelkaMunk(pigments)
    case 'layer-opaque': return mixLayerOpaque(pigments)
  }
}

// Muddiness: low chroma + mid lightness = muddy
export function isMuddy(rgb: RGB): boolean {
  const hsl = rgbToHsl(rgb)
  return hsl.s < 25 && hsl.l > 20 && hsl.l < 70
}
