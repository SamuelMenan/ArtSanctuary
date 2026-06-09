// Atlas anatómico por PARTE del cuerpo (sistema profundo). DATA pura y ESCALABLE:
// cada dimensión es un RATIO (unidades-cabeza o relativo a otra parte), nunca cm
// fijos — así cualquier altura/canon se calcula al instante (ver `figure.ts`).
// El texto visible vive SOLO en i18n (`canon.part.*`).
//
// Reglas (ver docs/pr/importantes/canon/plan-canon-anatomy-deep.md §6):
//  - Scope ADULTO (P1). El eje edad es extensión futura con tabla propia.
//  - Cada `source` obligatorio; sin fuente no entra (P2). Richer(1890)/Vitruvio
//    son dominio público y se prefieren. Arte de las láminas: 100% propio.
//  - `relativeTo` permite ratios anidados sub-parte→parte (P3) para no acumular
//    error midiendo todo en cabezas globales.

import type { FactSource } from './anatomyFacts'
import type { AnatomyRef, MeasureView } from './measurements'

/** Eje de la dimensión. */
export type DimAxis = 'length' | 'width' | 'depth' | 'girth'

/** Vistas posibles de una lámina de parte (más finas que las del cuerpo). */
export type PartView =
  | 'frontal' | 'lateral' | 'posterior' | 'threequarter'
  | 'dorsal' | 'palmar' | 'medial' | 'plantar'

/**
 * Una dimensión medible de una parte. Es un RATIO:
 *  - `heads`: fracción de la altura total (unidad-cabeza). Escala con `headCm`.
 *  - o `relativeTo` + `ratio`: fracción de OTRA dimensión (p. ej. palma = 0.5·mano).
 * `ref` da el rango anatómico (Δ); `source` la procedencia.
 */
export interface PartDimension {
  key: string // i18n: canon.part.<part>.dim.<key>
  axis: DimAxis
  heads?: number
  relativeTo?: string // key de otra dimensión (de la misma parte)
  ratio?: number // valor cuando hay relativeTo
  ref?: AnatomyRef
  source: FactSource
}

/** Región clicable sobre la lámina de CUERPO, por vista: path SVG normalizado
 *  (viewBox 0..1) + ancla de etiqueta. Vacío hasta medirlo (degrada limpio). */
export interface PartHit {
  path: string
  cx: number
  cy: number
}

export interface BodyPart {
  key: string
  region: 'head' | 'trunk' | 'arm' | 'leg'
  /** Zonas clicables sobre la figura por vista del CUERPO (frontal/lateral/posterior). */
  hit: Partial<Record<MeasureView, PartHit>>
  /** Láminas dedicadas de la parte por vista. Vacío → fallback zoom a la figura. */
  image: Partial<Record<PartView, string>>
  /** Hay nota i18n `canon.part.<key>.blurb`. */
  blurb?: boolean
  dims: PartDimension[]
  /** Sub-partes anidadas (mano→palma/dedos→falanges, pie→dedos…). Cada una es
   *  un BodyPart con sus propias dims/children. Las dims de un hijo se expresan
   *  en `heads` ABSOLUTAS (ratio del cuerpo) — siguen siendo escalables — o
   *  `relativeTo` a otra dim del MISMO hijo. */
  children?: BodyPart[]
}

// Helpers de construcción (compactan la tabla).
const H = (key: string, axis: DimAxis, heads: number, source: FactSource, ref?: AnatomyRef): PartDimension =>
  ({ key, axis, heads, source, ref })
const R = (key: string, axis: DimAxis, relativeTo: string, ratio: number, source: FactSource): PartDimension =>
  ({ key, axis, relativeTo, ratio, source })

/**
 * Atlas adulto. Las partes son CANON-AGNÓSTICAS (un set sirve a todos los
 * cánones; solo pelvis/tórax podrían ganar variante ♀ en el futuro). `hit` e
 * `image` se rellenan al medir/generar; las `dims` ya son utilizables.
 */
export const BODY_PARTS: BodyPart[] = [
  {
    key: 'head', region: 'head', hit: {}, image: {}, blurb: true,
    dims: [
      H('height', 'length', 1, 'loomis'),
      H('width', 'width', 0.66, 'anthropometry', { min: 0.6, max: 0.72 }),
      H('depth', 'depth', 0.8, 'anthropometry', { min: 0.72, max: 0.88 }),
      R('eyeLine', 'length', 'height', 0.5, 'loomis'), // ojos a ½ de la altura de la cabeza
      R('faceThird', 'length', 'height', 0.33, 'loomis'), // tercios faciales iguales
    ],
  },
  {
    key: 'neck', region: 'trunk', hit: {}, image: {},
    dims: [
      H('length', 'length', 0.33, 'richer', { min: 0.25, max: 0.4 }),
      H('width', 'width', 0.5, 'anthropometry', { min: 0.4, max: 0.6 }),
      H('depth', 'depth', 0.55, 'anthropometry', { min: 0.45, max: 0.65 }),
    ],
  },
  {
    key: 'torso', region: 'trunk', hit: {}, image: {}, blurb: true,
    dims: [
      H('length', 'length', 3, 'loomis', { min: 2.9, max: 3.1 }), // mentón → pubis
      H('width', 'width', 1.5, 'anthropometry', { min: 1.4, max: 1.7 }),
      H('depth', 'depth', 0.95, 'anthropometry', { min: 0.85, max: 1.05 }),
      R('nippleLine', 'length', 'length', 0.33, 'loomis'), // pezones ~2.ª cabeza
    ],
  },
  {
    key: 'pelvis', region: 'trunk', hit: {}, image: {},
    dims: [
      H('width', 'width', 1.6, 'anthropometry', { min: 1.5, max: 1.7 }),
      H('depth', 'depth', 0.95, 'anthropometry', { min: 0.85, max: 1.05 }),
    ],
  },
  {
    key: 'arm', region: 'arm', hit: {}, image: {}, blurb: true,
    dims: [
      H('upperArm', 'length', 1.4, 'loomis', { min: 1.45, max: 1.55 }),
      H('forearm', 'length', 1.15, 'loomis', { min: 1.1, max: 1.2 }),
      H('full', 'length', 3.45, 'loomis', { min: 3.4, max: 3.6 }), // hombro → punta dedos
    ],
  },
  {
    key: 'forearm', region: 'arm', hit: {}, image: {},
    dims: [
      H('length', 'length', 1.15, 'loomis', { min: 1.1, max: 1.2 }),
    ],
  },
  {
    key: 'hand', region: 'arm', hit: {}, image: {}, blurb: true,
    dims: [
      H('length', 'length', 0.9, 'richer', { min: 0.85, max: 0.95 }), // ≈ largo de la cara
      H('width', 'width', 0.4, 'richer'),
    ],
    // Sub-partes confirmadas (Richer). Las falanges por dedo se añaden en H2,
    // solo tras confirmarlas contra Richer/Bridgman (no se inventan).
    children: [
      { key: 'palm', region: 'arm', hit: {}, image: {}, dims: [H('length', 'length', 0.45, 'richer')] }, // palma ≈ ½ mano (0.5·0.9)
      { key: 'middleFinger', region: 'arm', hit: {}, image: {}, dims: [H('length', 'length', 0.45, 'richer')] }, // dedo medio ≈ ½ mano
    ],
  },
  {
    key: 'thigh', region: 'leg', hit: {}, image: {},
    dims: [
      H('length', 'length', 2, 'loomis', { min: 1.9, max: 2.1 }),
    ],
  },
  {
    key: 'leg', region: 'leg', hit: {}, image: {}, blurb: true,
    dims: [
      H('shin', 'length', 1.7, 'loomis', { min: 1.5, max: 1.6 }), // rótula → planta
      H('full', 'length', 3.7, 'loomis', { min: 3.5, max: 3.8 }), // pubis → planta
    ],
  },
  {
    key: 'foot', region: 'leg', hit: {}, image: {}, blurb: true,
    dims: [
      H('length', 'length', 1, 'richer', { min: 0.95, max: 1.05 }), // ≈ 1 cabeza
      H('height', 'length', 0.3, 'richer'), // alto del empeine
      H('width', 'width', 0.35, 'richer'),
    ],
  },
]

/** Recorre una parte y TODAS sus sub-partes (pre-orden: parte antes que hijos).
 *  Interno por ahora; se exportará cuando el panel árbol (H3) lo consuma. */
function walkParts(part: BodyPart): BodyPart[] {
  const out: BodyPart[] = [part]
  for (const c of part.children ?? []) out.push(...walkParts(c))
  return out
}

/** Todas las partes del atlas, aplanadas (raíces + descendientes). */
export function allParts(): BodyPart[] {
  return BODY_PARTS.flatMap(walkParts)
}

/** Raíces agrupadas por región (para el árbol del panel). Orden estable. */
const REGION_ORDER = ['head', 'trunk', 'arm', 'leg'] as const
export function partTree(): { region: (typeof REGION_ORDER)[number]; parts: BodyPart[] }[] {
  return REGION_ORDER.map((region) => ({ region, parts: BODY_PARTS.filter((p) => p.region === region) }))
}

// Índice por clave sobre el árbol COMPLETO (incluye sub-partes).
const PART_INDEX: Record<string, BodyPart> = Object.fromEntries(allParts().map((p) => [p.key, p]))

/** Parte (o sub-parte) por clave. */
export function getPart(key: string): BodyPart | undefined {
  return PART_INDEX[key]
}

/**
 * Resuelve una dimensión a unidades-cabeza, siguiendo `relativeTo` si lo hay.
 * Devuelve `null` si la cadena relativa no resuelve. Puro y O(profundidad).
 */
export function dimHeads(part: BodyPart, dim: PartDimension): number | null {
  if (dim.heads !== undefined) return dim.heads
  if (dim.relativeTo && dim.ratio !== undefined) {
    const parent = part.dims.find((d) => d.key === dim.relativeTo)
    if (!parent) return null
    const base = dimHeads(part, parent)
    return base === null ? null : base * dim.ratio
  }
  return null
}

/** Tamaño en cm de una dimensión dado el cm de una cabeza. */
export function dimCm(part: BodyPart, dim: PartDimension, headCm: number): number | null {
  const h = dimHeads(part, dim)
  return h === null ? null : h * headCm
}
