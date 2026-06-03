// Motor reglamentario Corpocarnaval — Fase 1.
// Fuente única de verdad para las reglas oficiales de bocetos volumétricos
// del Carnaval de Negros y Blancos de Pasto (Comunicado 003 - 2026, acreditación 2027).
//
// Todas las medidas están expresadas en CENTÍMETROS sobre el BOCETO (modelo a escala),
// no sobre la obra real. La conversión boceto↔obra se hace con `scale`.
//
// Si Corpocarnaval publica un nuevo comunicado, basta editar este archivo:
// el resto del sistema (inspector, zonas, expediente) lee de aquí.

export const CARNAVAL_SOURCE = {
  comunicado: 'Comunicado 003 - 12/05/2026',
  acreditacion: 2027,
  entidad: 'Corpocarnaval — Área de Cultura',
} as const

export type CarnavalModality = 'disfraz' | 'comparsa' | 'carroAlegorico' | 'carroza'

/** Eje dimensional validable de un boceto. */
export type CarnavalAxis = 'alto' | 'ancho' | 'largo' | 'espesor'

/**
 * Rango reglamentario de un eje, en cm sobre el boceto.
 * `min`/`max` ausentes = sin límite por ese lado.
 * `exact` (bases) = el valor debe ser exacto (ni más ni menos), no un rango.
 */
export type DimRange = {
  min?: number
  max?: number
  /** Valor exigido exacto (p. ej. base de madera). Tiene prioridad sobre min/max. */
  exact?: number
}

export type CarnavalBase = {
  /** Geometría exigida por el reglamento. */
  type: 'cuadrada' | 'madera'
  ancho: number // cm, exacto
  largo: number // cm, exacto
  espesor: number // cm, exacto
  /** Color obligatorio de la base, si el reglamento lo exige. */
  color?: 'negro'
  /** El comunicado recalca "la medida de la base debe ser exacta". */
  exact: boolean
}

export type CarnavalRule = {
  id: CarnavalModality
  /** Etiqueta oficial para UI. */
  label: string
  /**
   * Denominador de escala obra:boceto (1:scale).
   * Ej. 10 → 1:10 · 15 → 1:15. Multiplica una medida del boceto para obtener la real.
   */
  scale: number
  /** Indica si la escala viene textual en el comunicado o fue inferida de las medidas. */
  scaleSource: 'comunicado' | 'inferida'
  /** cm/cuadro sugerido para la cuadrícula del Board en esta modalidad. */
  gridSquareCm: number
  /** Rangos por eje, en cm sobre el boceto. */
  dims: Record<CarnavalAxis, DimRange | undefined>
  /** Base obligatoria del boceto. */
  base: CarnavalBase
  /** Altura reglamentaria de la figura humana de referencia (hombros), en cm. `null` si no aplica. */
  humanRefCm: number | null
  /** La modalidad exige delimitar zonas de jugadores dentro del boceto. */
  requiresPlayerZones: boolean
  /** Número de bocetos volumétricos a presentar. */
  bocetosRequeridos: number
  /** Notas literales/parafraseadas del comunicado relevantes para el artesano. */
  notes: string[]
}

// ──────────────────────────────────────────────────────────────────────────
// Reglas oficiales (Comunicado 003-2026)
// ──────────────────────────────────────────────────────────────────────────

export const CARNAVAL_RULES: Record<CarnavalModality, CarnavalRule> = {
  disfraz: {
    id: 'disfraz',
    label: 'Disfraz Individual',
    scale: 10,
    scaleSource: 'comunicado',
    gridSquareCm: 1,
    dims: {
      alto: { min: 12, max: 15 },
      ancho: { min: 15, max: 25 },
      largo: { min: 10, max: 20 }, // largo / profundidad
      espesor: { exact: 2 },
    },
    base: { type: 'cuadrada', ancho: 20, largo: 20, espesor: 2, exact: true },
    humanRefCm: 15,
    requiresPlayerZones: false,
    bocetosRequeridos: 1,
    notes: [
      'Boceto volumétrico a escala 1:10.',
      'Estructura básica del cuerpo humano: 15 cm hasta los hombros.',
      'La medida se toma de los hombros del jugador hacia arriba.',
      'Zancos, zancos saltarines u otros elementos deben ir insertos y explícitos en el texto.',
    ],
  },

  comparsa: {
    id: 'comparsa',
    label: 'Comparsa',
    scale: 10,
    scaleSource: 'comunicado',
    gridSquareCm: 1,
    dims: {
      alto: { min: 20, max: 25 },
      ancho: { max: 35 },
      largo: undefined,
      espesor: { exact: 2 },
    },
    base: { type: 'cuadrada', ancho: 20, largo: 20, espesor: 2, exact: true },
    humanRefCm: 15,
    requiresPlayerZones: false,
    bocetosRequeridos: 3,
    notes: [
      'Tres (3) bocetos volumétricos a escala 1:10; uno usando el cuerpo humano como estructura básica.',
      'Figura humana hasta los hombros: 15 cm. La medida se toma de los hombros hacia arriba.',
      'No se puede utilizar el maniquí de madera como soporte.',
      'No se recibirán bocetos que no cumplan las medidas de presentación.',
    ],
  },

  carroAlegorico: {
    id: 'carroAlegorico',
    label: 'Carro Alegórico',
    scale: 15,
    scaleSource: 'inferida', // el comunicado no fija escala textual; se infiere de las medidas
    gridSquareCm: 5,
    dims: {
      alto: { min: 23.3, max: 33.3 },
      ancho: { min: 20, max: 26.6 },
      largo: { min: 53.3, max: 66.6 },
      espesor: { exact: 4 },
    },
    base: { type: 'madera', ancho: 32, largo: 70, espesor: 4, color: 'negro', exact: true },
    humanRefCm: null,
    requiresPlayerZones: true,
    bocetosRequeridos: 1,
    notes: [
      'Boceto en material resistente al tacto para traslado y montaje.',
      'Delimitar dentro del boceto las zonas donde se ubicarán los jugadores.',
      'La medida de la base debe ser exacta, de color negro.',
      'No se recibirán bocetos que no cumplan las medidas de presentación.',
    ],
  },

  carroza: {
    id: 'carroza',
    label: 'Carroza',
    scale: 15,
    scaleSource: 'comunicado',
    gridSquareCm: 5,
    dims: {
      alto: { max: 41.3 },
      ancho: { min: 24, max: 28.6 },
      largo: { min: 86.6, max: 106.6 },
      espesor: { exact: 2 },
    },
    base: { type: 'madera', ancho: 32, largo: 110, espesor: 2, color: 'negro', exact: true },
    humanRefCm: null,
    requiresPlayerZones: true,
    bocetosRequeridos: 1,
    notes: [
      'Boceto volumétrico a escala 1:15, en material resistente al tacto.',
      'Delimitar dentro del boceto las zonas donde se ubicarán los jugadores.',
      'La medida de la base debe ser exacta y de color negro.',
      'No se recibirán bocetos que no cumplan las medidas de presentación.',
    ],
  },
}

export const CARNAVAL_MODALITIES = Object.keys(CARNAVAL_RULES) as CarnavalModality[]

/** Devuelve la regla de una modalidad. */
export function getCarnavalRule(modality: CarnavalModality): CarnavalRule {
  return CARNAVAL_RULES[modality]
}

/** ¿Es un valor de modalidad válido? (útil al leer datos persistidos). */
export function isCarnavalModality(v: unknown): v is CarnavalModality {
  return typeof v === 'string' && v in CARNAVAL_RULES
}

/** Convierte una medida del boceto (cm) a la obra real (cm) según la escala. */
export function bocetoToReal(rule: CarnavalRule, bocetoCm: number): number {
  return bocetoCm * rule.scale
}

/** Convierte una medida de la obra real (cm) a su boceto (cm) según la escala. */
export function realToBoceto(rule: CarnavalRule, realCm: number): number {
  return realCm / rule.scale
}
