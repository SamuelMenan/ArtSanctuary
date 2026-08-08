import { describe, it, expect } from 'vitest'
import { getPartHits, hasPartHits } from './partHits'
import { BODY_PARTS } from './anatomyParts'
import { getRegion } from './regions'

const ROOT_KEYS = new Set(BODY_PARTS.map((p) => p.key))
// Clave clicable válida = raíz del atlas (parte-con-dim) O región-zona de
// superficie (chest/abdomen/flank/lats…): regiones ⊇ partes-con-dim ∪ zonas.
const isValidKey = (key: string) => ROOT_KEYS.has(key) || getRegion(key) !== undefined

// Mapa de músculos FRONTAL = DIBUJO del usuario (musculos.png) trazado por color
// (lámina musculosblanco.png). Grupos del dibujo, trapecio PROPIO (capa morada).
// Sin `hand` (sin colorear en el dibujo). Glúteo es posterior/lateral → NO frontal.
const HEROIC_FRONTAL_TRACED = [
  // pelvis ELIMINADA del frontal: no es un músculo (hueso de origen/inserción); su
  // superficie la toman abdomen/flank (oblicuos) y thigh (recto fem./sartorio/TFL/aductores).
  'head', 'neck', 'trapezius', 'shoulder', 'chest', 'bicep', 'forearm', 'hand',
  'abdomen', 'flank', 'thigh', 'knee', 'leg', 'foot',
]

describe('partHits (regiones clicables por canon-vista)', () => {
  it('heroico frontal traza las regiones del dibujo (incluye trapecio; sin mano)', () => {
    const hits = getPartHits('heroic', 'frontal')
    expect(Object.keys(hits).sort()).toEqual([...HEROIC_FRONTAL_TRACED].sort())
    expect(hasPartHits('heroic', 'frontal')).toBe(true)
  })

  it('frontal: trapecio y mano son regiones PROPIAS; codo/muñeca/tobillo no se trazan', () => {
    const hits = getPartHits('heroic', 'frontal')
    for (const k of ['trapezius', 'hand']) expect(hits[k], k).toBeDefined()
    for (const k of ['elbow', 'wrist', 'ankle']) expect(hits[k], k).toBeUndefined()
  })

  it('glúteo NO se traza en frontal (es posterior/lateral)', () => {
    expect(getPartHits('heroic', 'frontal').gluteus).toBeUndefined()
  })

  it('heroico posterior divide la espalda en masas anatómicas con nombres propios', () => {
    const hits = getPartHits('heroic', 'posterior')
    expect(hasPartHits('heroic', 'posterior')).toBe(true)
    // Masas de espalda del écorché a color (trapecio·deltoide·dorsal·infraespinoso·
    // lumbar) + cuello + glúteos + brazos/piernas:
    for (const k of ['neck', 'trapezius', 'shoulder', 'lats', 'infraspinatus', 'lumbar', 'gluteus', 'arm', 'forearm', 'hamstring', 'popliteal', 'calf']) {
      expect(hits[k], k).toBeDefined()
    }
    // Bloque único viejo / sub-zonas fusionadas / claves frontales que NO aplican:
    for (const k of ['back', 'torso', 'pelvis', 'nape', 'upperBack', 'scapula', 'knee', 'leg', 'thigh', 'chest']) {
      expect(hits[k], k).toBeUndefined()
    }
  })

  it('heroico lateral = bandas de perfil (flank/hip propios); brazo fundido → omitido', () => {
    const hits = getPartHits('heroic', 'lateral')
    expect(hasPartHits('heroic', 'lateral')).toBe(true)
    for (const k of ['head', 'neck', 'flank', 'hip', 'thigh', 'knee', 'leg', 'ankle', 'foot', 'trapezius', 'chest', 'abdomen', 'gluteus']) {
      expect(hits[k], k).toBeDefined()
    }
    // El brazo se funde con el torso en perfil → NO clicable; tampoco claves de otras vistas:
    for (const k of ['arm', 'forearm', 'hand', 'shoulder', 'back']) {
      expect(hits[k], k).toBeUndefined()
    }
  })

  it('todo lo trazado en posterior/lateral es path M/L/Z válido con coords 0..1', () => {
    for (const v of ['posterior', 'lateral'] as const)
    for (const [key, hit] of Object.entries(getPartHits('heroic', v))) {
      expect(hit.path, key).toMatch(/^M[\d .MLZ]+Z$/)
      for (const c of hit.path.match(/[\d.]+/g)!.map(Number)) {
        expect(c).toBeGreaterThanOrEqual(0)
        expect(c).toBeLessThanOrEqual(1)
      }
    }
  })

  it('las zonas de superficie posteriores existen en regions.ts (ficha nombre+blurb)', async () => {
    const { getRegion } = await import('./regions')
    for (const k of ['lats', 'infraspinatus', 'lumbar', 'hamstring', 'popliteal', 'calf']) {
      expect(getRegion(k), k).toBeDefined()
    }
  })

  it('todo lo trazado es parte-con-dim o región-zona (nunca al revés)', () => {
    for (const key of Object.keys(getPartHits('heroic', 'frontal'))) {
      expect(isValidKey(key), key).toBe(true)
    }
  })

  it('canon-vista sin trazado degrada limpio (vacío, no rompe)', () => {
    expect(getPartHits('academic', 'frontal')).toEqual({})
    expect(getPartHits('comic', 'lateral')).toEqual({})
    expect(hasPartHits('comic', 'posterior')).toBe(false)
  })

  it('cada key trazada existe como parte-con-dim o región-zona', () => {
    for (const key of Object.keys(getPartHits('heroic', 'frontal'))) {
      expect(isValidKey(key), key).toBe(true)
    }
  })

  it('cada path es M/L/Z válido con coordenadas normalizadas 0..1', () => {
    for (const [key, hit] of Object.entries(getPartHits('heroic', 'frontal'))) {
      // Solo comandos M, L y Z (subpaths permitidos: M…Z M…Z).
      expect(hit.path, key).toMatch(/^M[\d .MLZ]+Z$/)
      const coords = hit.path.match(/[\d.]+/g)!.map(Number)
      expect(coords.length % 2, key).toBe(0)
      for (const c of coords) {
        expect(c).toBeGreaterThanOrEqual(0)
        expect(c).toBeLessThanOrEqual(1)
      }
    }
  })

  it('cada ancla (cx, cy) cae dentro de 0..1', () => {
    for (const [key, hit] of Object.entries(getPartHits('heroic', 'frontal'))) {
      expect(hit.cx, key).toBeGreaterThan(0)
      expect(hit.cx, key).toBeLessThan(1)
      expect(hit.cy, key).toBeGreaterThan(0)
      expect(hit.cy, key).toBeLessThan(1)
    }
  })

  it('cada región frontal tiene ≥1 subpath (unión de componentes del dibujo)', () => {
    const hits = getPartHits('heroic', 'frontal')
    const subs = (p: string) => p.split('M').filter(Boolean).length
    // pareadas (L/R separadas) → ≥2; thigh/abdomen pueden fundirse al centro → ≥1.
    for (const k of ['shoulder', 'bicep', 'forearm', 'hand', 'flank', 'knee', 'leg', 'foot']) expect(subs(hits[k].path), k).toBeGreaterThanOrEqual(2)
    for (const k of HEROIC_FRONTAL_TRACED) expect(subs(hits[k].path), k).toBeGreaterThanOrEqual(1)
  })
})
