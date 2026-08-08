// Regiones de SUPERFICIE clicables que NO son partes-con-dimensión del atlas
// (`anatomyParts.ts`). Son ZONAS de piel/músculo que se enseñan con nombre +
// nota + fuente, pero NO tienen una medida lineal limpia con procedencia —
// forzarles un `heads` sería inventar (rompe la regla dura). Por eso:
//
//   regiones clicables (partHits.ts)  ⊇  partes-con-dim (anatomyParts.ts) ∪ regiones-zona (aquí)
//
// Una región-zona existe SOLO en su(s) vista(s) (pecho de frente, espalda/lumbar
// de espalda, costado de lado): eso lo gobierna `partHits.ts` por canon-vista.
// Aquí solo se declara su identidad (región del cuerpo + fuente del hecho) para
// que `CanonPartPanel` muestre nombre + blurb. Texto en i18n `canon.part.*`.
//
// Ver docs/pr/importantes/canon/plan-canon-hover-vistas-partes.md §"Regiones por vista".

import type { FactSource } from './anatomyFacts'

export interface SurfaceRegion {
  key: string
  /** Región del cuerpo (para agrupar/colorear, igual que `BodyPart.region`). */
  region: 'head' | 'trunk' | 'arm' | 'leg'
  /** Fuente del hecho del blurb (i18n `canon.part.blurb.<key>`). */
  source: FactSource
}

const R = (key: string, region: SurfaceRegion['region'], source: FactSource): SurfaceRegion =>
  ({ key, region, source })

/** Zonas de superficie clicables sin dimensión propia (solo nombre + blurb). */
export const SURFACE_REGIONS: SurfaceRegion[] = [
  R('lats', 'trunk', 'bridgman'), // dorsal ancho (posterior)
  R('infraspinatus', 'trunk', 'bridgman'), // infraespinoso + redondos (posterior)
  R('lumbar', 'trunk', 'richer'), // zona lumbar / erectores (posterior)
  R('bicep', 'arm', 'bridgman'), // bíceps / brazo anterior (frontal)
  R('chest', 'trunk', 'loomis'), // pecho / pectorales (frontal)
  R('abdomen', 'trunk', 'loomis'), // abdomen / recto (frontal·lateral)
  R('flank', 'trunk', 'bridgman'), // costado / oblicuo + dorsal ancho (lateral)
  R('hip', 'trunk', 'anthropometry'), // cadera / trocánter mayor (lateral·posterior)
  R('hamstring', 'leg', 'bridgman'), // isquiotibiales (posterior)
  R('popliteal', 'leg', 'richer'), // corva / hueco poplíteo (posterior)
  R('calf', 'leg', 'bridgman'), // pantorrilla / gemelos (posterior·lateral)
  R('heel', 'leg', 'richer'), // talón / calcáneo (posterior·lateral)
]

const REGION_INDEX: Record<string, SurfaceRegion> = Object.fromEntries(
  SURFACE_REGIONS.map((r) => [r.key, r]),
)

/** Región-zona por clave (o `undefined` si la clave es una parte-con-dim u otra). */
export function getRegion(key: string): SurfaceRegion | undefined {
  return REGION_INDEX[key]
}
