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
import type { AnatomyRef } from './measurements'

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

// Las zonas CLICABLES sobre la figura NO viven aquí: son por CANON-VISTA (cada
// lámina tiene su dibujo) → `partHits.ts`, mismo patrón que landmarks/joints.

export interface BodyPart {
  key: string
  region: 'head' | 'trunk' | 'arm' | 'leg'
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

/** Sufijos de falange por nº (3 normal, 2 el pulgar). El `kind` (proximal/
 *  middle/distal) sirve a la i18n; la `key` se prefija con el dedo para ser única
 *  en el índice global del atlas. */
const PHALANX_KINDS = ['proximal', 'middle', 'distal'] as const
/** Construye un dedo: largo total + falanges. Cada falange es `heads` absolutas
 *  (decreciente prox>medio>distal, Bridgman); rango ±20%. El pulgar usa 2. */
const finger = (key: string, len: number, lenSource: FactSource, phalanges: number[]): BodyPart => {
  const kinds = phalanges.length === 2 ? (['proximal', 'distal'] as const) : PHALANX_KINDS
  return {
    key, region: 'arm', image: {},
    dims: [H('length', 'length', len, lenSource, { min: +(len * 0.88).toFixed(3), max: +(len * 1.12).toFixed(3) })],
    children: phalanges.map((p, i) => ({
      key: `${key}_${kinds[i]}`,
      region: 'arm' as const, image: {},
      dims: [H('length', 'length', p, 'bridgman', { min: +(p * 0.8).toFixed(3), max: +(p * 1.2).toFixed(3) })],
    })),
  }
}

/**
 * Atlas adulto. Las partes son CANON-AGNÓSTICAS (un set sirve a todos los
 * cánones; solo pelvis/tórax podrían ganar variante ♀ en el futuro). `image`
 * se rellena al generar assets; las `dims` ya son utilizables.
 */
export const BODY_PARTS: BodyPart[] = [
  {
    key: 'head', region: 'head', image: {}, blurb: true,
    dims: [
      H('height', 'length', 1, 'loomis'),
      H('width', 'width', 0.66, 'anthropometry', { min: 0.6, max: 0.72 }),
      H('depth', 'depth', 0.8, 'anthropometry', { min: 0.72, max: 0.88 }),
      R('eyeLine', 'length', 'height', 0.5, 'loomis'), // ojos a ½ de la altura de la cabeza
      R('faceThird', 'length', 'height', 0.33, 'loomis'), // tercios faciales iguales
    ],
    // Rasgos faciales (construcción Loomis). Largos/anchos como fracción de la
    // cabeza (1 cab de alto, 0.66 de ancho).
    children: [
      { key: 'eye', region: 'head', image: {}, dims: [H('width', 'width', 0.132, 'loomis', { min: 0.11, max: 0.15 })] }, // ojo ≈ 1/5 del ancho de la cara
      { key: 'nose', region: 'head', image: {}, dims: [H('length', 'length', 0.28, 'loomis', { min: 0.24, max: 0.32 })] }, // cejas → base de la nariz (un tercio facial)
      { key: 'ear', region: 'head', image: {}, dims: [H('length', 'length', 0.3, 'loomis', { min: 0.26, max: 0.34 })] }, // ceja → base de la nariz
      { key: 'mouth', region: 'head', image: {}, dims: [H('width', 'width', 0.3, 'loomis', { min: 0.26, max: 0.34 })] }, // ancho ≈ entre pupilas
    ],
  },
  {
    key: 'neck', region: 'trunk', image: {},
    dims: [
      H('length', 'length', 0.33, 'richer', { min: 0.25, max: 0.4 }),
      H('width', 'width', 0.5, 'anthropometry', { min: 0.4, max: 0.6 }),
      H('depth', 'depth', 0.55, 'anthropometry', { min: 0.45, max: 0.65 }),
    ],
  },
  {
    // Trapecio: músculo en cometa nuca→mitad de la espalda. Largo visible del
    // vértice inferior (Richer). Ver plan-canon-hover-vistas-partes.md §0 (N1).
    key: 'trapezius', region: 'trunk', image: {}, blurb: true,
    dims: [H('length', 'length', 1.5, 'richer', { min: 1.3, max: 1.7 })],
  },
  {
    key: 'torso', region: 'trunk', image: {}, blurb: true,
    dims: [
      H('length', 'length', 3, 'loomis', { min: 2.9, max: 3.1 }), // mentón → pubis
      H('width', 'width', 1.5, 'anthropometry', { min: 1.4, max: 1.7 }),
      H('depth', 'depth', 0.95, 'anthropometry', { min: 0.85, max: 1.05 }),
      R('nippleLine', 'length', 'length', 0.33, 'loomis'), // pezones ~2.ª cabeza
    ],
  },
  {
    key: 'pelvis', region: 'trunk', image: {},
    dims: [
      H('width', 'width', 1.6, 'anthropometry', { min: 1.5, max: 1.7 }),
      H('depth', 'depth', 0.95, 'anthropometry', { min: 0.85, max: 1.05 }),
    ],
  },
  {
    // Glúteos: cresta ilíaca → pliegue glúteo ≈ 1 cabeza de alto (Richer). Solo
    // clicable en posterior/lateral; en frontal no tendrá `path` (degrada limpio).
    key: 'gluteus', region: 'trunk', image: {}, blurb: true,
    dims: [
      H('height', 'length', 1.0, 'richer', { min: 0.9, max: 1.05 }),
      H('width', 'width', 1.5, 'richer', { min: 1.4, max: 1.7 }),
    ],
  },
  {
    // Hombro/deltoides: cubre el tercio superior del brazo (Bridgman); su masa
    // marca la línea más ancha del cuerpo. Cede el deltoide que A3 dejó en `arm`.
    key: 'shoulder', region: 'arm', image: {}, blurb: true,
    dims: [
      H('height', 'length', 0.6, 'bridgman', { min: 0.5, max: 0.7 }),
      H('width', 'width', 0.5, 'bridgman', { min: 0.45, max: 0.6 }),
    ],
  },
  {
    key: 'arm', region: 'arm', image: {}, blurb: true,
    dims: [
      H('upperArm', 'length', 1.4, 'loomis', { min: 1.45, max: 1.55 }),
      H('forearm', 'length', 1.15, 'loomis', { min: 1.1, max: 1.2 }),
      H('full', 'length', 3.45, 'loomis', { min: 3.4, max: 3.6 }), // hombro → punta dedos
    ],
  },
  {
    // Codo: ancho biepicondilar ≈ 1/3 cabeza (ANSUR II). Cae a la altura de la
    // cintura (regla posicional en CROSS_RULES `elbowWaist`).
    key: 'elbow', region: 'arm', image: {}, blurb: true,
    dims: [H('width', 'width', 0.33, 'anthropometry', { min: 0.3, max: 0.38 })],
  },
  {
    key: 'forearm', region: 'arm', image: {},
    dims: [
      H('length', 'length', 1.15, 'loomis', { min: 1.1, max: 1.2 }),
    ],
  },
  {
    // Muñeca: ancho biestiloideo ≈ 1/4 cabeza (ANSUR II), más estrecha que el
    // antebrazo. Cae en la entrepierna (CROSS_RULES `wristCrotch`).
    key: 'wrist', region: 'arm', image: {}, blurb: true,
    dims: [H('width', 'width', 0.25, 'anthropometry', { min: 0.22, max: 0.28 })],
  },
  {
    key: 'hand', region: 'arm', image: {}, blurb: true,
    dims: [
      H('length', 'length', 0.9, 'richer', { min: 0.85, max: 0.95 }), // ≈ largo de la cara
      H('width', 'width', 0.4, 'richer'),
    ],
    // Sub-partes: palma + 5 dedos. Largos como fracción de la mano (0.9 cab),
    // orden confirmado medio>anular>índice>meñique>pulgar (antropometría); rangos
    // amplios por alta variabilidad. El dedo medio lleva sus 3 falanges
    // (proporción decreciente prox>medio>distal, Bridgman) como descomposición
    // de referencia; el resto se descompone en H2b tras confirmarlas.
    children: [
      { key: 'palm', region: 'arm', image: {}, dims: [H('length', 'length', 0.45, 'richer', { min: 0.42, max: 0.48 })] }, // palma ≈ ½ mano
      finger('thumb', 0.31, 'anthropometry', [0.17, 0.14]), // 2 falanges
      finger('indexFinger', 0.41, 'anthropometry', [0.185, 0.123, 0.103]),
      finger('middleFinger', 0.45, 'richer', [0.2, 0.135, 0.115]), // dedo medio ≈ ½ mano
      finger('ringFinger', 0.43, 'anthropometry', [0.194, 0.129, 0.108]),
      finger('littleFinger', 0.34, 'anthropometry', [0.153, 0.102, 0.085]),
    ],
  },
  {
    key: 'thigh', region: 'leg', image: {},
    dims: [
      H('length', 'length', 2, 'loomis', { min: 1.9, max: 2.1 }),
    ],
  },
  {
    // Rodilla: ancho bicondilar ≈ 0.4 cabeza (ANSUR II; bicondilar óseo 79±3mm).
    // La rótula cae en `frac` 0.64 (landmark `rodillas`, no es dim).
    key: 'knee', region: 'leg', image: {}, blurb: true,
    dims: [H('width', 'width', 0.41, 'anthropometry', { min: 0.38, max: 0.46 })],
  },
  {
    key: 'leg', region: 'leg', image: {}, blurb: true,
    dims: [
      H('shin', 'length', 1.7, 'loomis', { min: 1.5, max: 1.6 }), // rótula → planta
      H('full', 'length', 3.7, 'loomis', { min: 3.5, max: 3.8 }), // pubis → planta
    ],
  },
  {
    // Tobillo: ancho bimaleolar ≈ 0.3 cabeza (ANSUR II). Rasgo de dibujo: el
    // maléolo interno queda más alto y adelantado que el externo (Richer, fact).
    key: 'ankle', region: 'leg', image: {}, blurb: true,
    dims: [H('width', 'width', 0.31, 'anthropometry', { min: 0.29, max: 0.35 })],
  },
  {
    key: 'foot', region: 'leg', image: {}, blurb: true,
    dims: [
      H('length', 'length', 1, 'richer', { min: 0.95, max: 1.05 }), // ≈ 1 cabeza
      H('height', 'length', 0.3, 'richer'), // alto del empeine
      H('width', 'width', 0.35, 'richer'),
    ],
    // Sub-partes: los 5 dedos, decrecientes del gordo al pequeño. Largos como
    // fracción del pie (antropometría); rangos amplios por variabilidad.
    children: [
      { key: 'bigToe', region: 'leg', image: {}, dims: [H('length', 'length', 0.18, 'anthropometry', { min: 0.14, max: 0.22 })] },
      { key: 'secondToe', region: 'leg', image: {}, dims: [H('length', 'length', 0.16, 'anthropometry', { min: 0.12, max: 0.2 })] },
      { key: 'thirdToe', region: 'leg', image: {}, dims: [H('length', 'length', 0.14, 'anthropometry', { min: 0.1, max: 0.18 })] },
      { key: 'fourthToe', region: 'leg', image: {}, dims: [H('length', 'length', 0.11, 'anthropometry', { min: 0.08, max: 0.15 })] },
      { key: 'littleToe', region: 'leg', image: {}, dims: [H('length', 'length', 0.08, 'anthropometry', { min: 0.05, max: 0.11 })] },
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
