// Cánones de proporción humana como DATA pura (sin SVG ni texto).
// Fuente única que consume `figure.ts` para generar el modelo de la figura, y
// que comparten la herramienta Canon y la silueta de Carnaval. Añadir un canon
// nuevo = una entrada en `CANONS`; nada más cambia.

/** Segmentos del cuerpo, de arriba abajo. La etiqueta visible vive en i18n
 *  (`canon.<key>`), no aquí, para no romper el escaneo de strings. */
export type SegmentKey =
  | 'head'
  | 'thorax'
  | 'abdomen'
  | 'pelvis'
  | 'thigh'
  | 'leg'
  | 'feet'

/** Orden canónico de los segmentos (top→bottom). */
export const SEGMENT_ORDER: readonly SegmentKey[] = [
  'head',
  'thorax',
  'abdomen',
  'pelvis',
  'thigh',
  'leg',
  'feet',
]

export interface CanonSegment {
  key: SegmentKey
  /** Altura del segmento en unidades-cabeza. */
  heads: number
}

/** Anchos característicos en unidades-cabeza (ancho = múltiplo de la cabeza).
 *  Se usan para dibujar las masas; no afectan la altura. */
export interface CanonWidths {
  shoulders: number
  waist: number
  pelvis: number
  /** Grosor base de una extremidad. */
  limb: number
}

export interface Canon {
  id: string
  /** Total de cabezas (== suma de `segments[].heads`). */
  headCount: number
  segments: CanonSegment[]
  widths: CanonWidths
}

const seg = (key: SegmentKey, heads: number): CanonSegment => ({ key, heads })

/**
 * Tabla de cánones. Cada `segments` suma EXACTO su `headCount` (verificado en
 * test). El canon académico (7.5) reproduce el layout histórico de la
 * herramienta para no alterar la figura existente ni la silueta de Carnaval.
 */
export const CANONS: Record<string, Canon> = {
  academic: {
    id: 'academic',
    headCount: 7.5,
    // Layout histórico: 13.33% por cabeza.
    segments: [
      seg('head', 1),
      seg('thorax', 1),
      seg('abdomen', 1),
      seg('pelvis', 1),
      seg('thigh', 1.5),
      seg('leg', 1.5),
      seg('feet', 0.5),
    ],
    widths: { shoulders: 1.7, waist: 1.4, pelvis: 1.55, limb: 0.35 },
  },
  heroic: {
    id: 'heroic',
    headCount: 8,
    segments: [
      seg('head', 1),
      seg('thorax', 1),
      seg('abdomen', 1),
      seg('pelvis', 1),
      seg('thigh', 1.75),
      seg('leg', 1.75),
      seg('feet', 0.5),
    ],
    widths: { shoulders: 2, waist: 1.45, pelvis: 1.6, limb: 0.36 },
  },
  comic: {
    id: 'comic',
    headCount: 8.5,
    segments: [
      seg('head', 1),
      seg('thorax', 1),
      seg('abdomen', 1),
      seg('pelvis', 1),
      seg('thigh', 2),
      seg('leg', 2),
      seg('feet', 0.5),
    ],
    widths: { shoulders: 2.1, waist: 1.45, pelvis: 1.62, limb: 0.36 },
  },

  // --- Eje FEMENINO ---------------------------------------------------------
  // Misma ALTURA (headCount/segmentos) que su contraparte masculina; lo que
  // cambia es la SILUETA (anchos): hombros más estrechos, cintura más marcada,
  // pelvis ancha (cadera ≥ hombros). Imágenes en `public/canon/<id>-female/`
  // (pendientes); prompts en `docs/helps/canon-image-prompts-female.md`.
  'academic-female': {
    id: 'academic-female',
    headCount: 7.5,
    segments: [
      seg('head', 1),
      seg('thorax', 1),
      seg('abdomen', 1),
      seg('pelvis', 1),
      seg('thigh', 1.5),
      seg('leg', 1.5),
      seg('feet', 0.5),
    ],
    widths: { shoulders: 1.45, waist: 1.15, pelvis: 1.6, limb: 0.32 },
  },
  'heroic-female': {
    id: 'heroic-female',
    headCount: 8,
    segments: [
      seg('head', 1),
      seg('thorax', 1),
      seg('abdomen', 1),
      seg('pelvis', 1),
      seg('thigh', 1.75),
      seg('leg', 1.75),
      seg('feet', 0.5),
    ],
    widths: { shoulders: 1.55, waist: 1.1, pelvis: 1.65, limb: 0.32 },
  },
  'comic-female': {
    id: 'comic-female',
    headCount: 8.5,
    segments: [
      seg('head', 1),
      seg('thorax', 1),
      seg('abdomen', 1),
      seg('pelvis', 1),
      seg('thigh', 2),
      seg('leg', 2),
      seg('feet', 0.5),
    ],
    widths: { shoulders: 1.6, waist: 1.05, pelvis: 1.68, limb: 0.31 },
  },
}

/** Canon por defecto (académico, 7.5 cabezas). */
export const DEFAULT_CANON_ID = 'academic'

/** Lista ordenada por nº de cabezas (para selectores de UI). */
export const CANON_LIST: Canon[] = Object.values(CANONS).sort((a, b) => a.headCount - b.headCount)

/** Devuelve un canon por id, con fallback al académico. */
export function getCanon(id: string | undefined): Canon {
  return (id && CANONS[id]) || CANONS[DEFAULT_CANON_ID]
}
