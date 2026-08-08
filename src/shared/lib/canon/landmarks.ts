// Landmarks anatómicos y marcas de división para la lámina de Canon.
// Datos puros; la etiqueta visible vive en i18n (`canon.landmarks.<key>`).
//
// `frac` = posición vertical como FRACCIÓN de la altura total (0 = coronilla,
// 1 = planta). Se mide con regla de píxeles sobre cada lámina de
// `public/canon/<canonId>/`. Cada canon (dibujo) tiene SUS propias alturas, así
// que los landmarks van por canon. Las 3 vistas de un mismo canon comparten
// estas alturas (frontal ≈ lateral ≈ posterior en Y).
//
// Añadir un canon nuevo = (1) imágenes en `public/canon/<id>/`, (2) dims en
// `ReferenceFigure`, (3) una entrada `frac` aquí (medida sobre el dibujo).

export interface Landmark {
  key: string
  /** Posición desde la coronilla como fracción de la altura total (0..1). */
  frac: number
  /** Lado donde se dibuja la etiqueta. Se alterna para que los landmarks muy
   *  juntos (cabeza/cuello/hombros) no se solapen. Por defecto 'left'. */
  side?: 'left' | 'right'
}

/** Landmarks ANATÓMICOS por canon (Capa 2 del sistema dual). Posiciones REALES
 *  medidas sobre la lámina `public/canon/<id>/` con regla de píxeles — NO se
 *  fuerzan a coincidir con las divisiones geométricas del canon (Capa 1). Que un
 *  landmark caiga entre dos cabezas es correcto, no un error. El `side` se alterna
 *  arriba (zona apretada) para legibilidad. */
// Anatomía REAL medida sobre cada lámina con regla de píxeles (overlay 5% en
// C:\tmp\ruler-<canon>.png, leído por mitades). Son fracciones de la altura
// total del cuerpo (0=coronilla, 1=planta), independientes de las divisiones
// geométricas del canon (capa 1). academic y comic salieron con la MISMA
// proporción de dibujo, así que comparten alturas medidas.
const MEASURED_ADULT: Landmark[] = [
  { key: 'cabeza', frac: 0.115, side: 'left' }, // mentón
  { key: 'cuello', frac: 0.15, side: 'right' }, // base del cuello / clavícula
  { key: 'hombros', frac: 0.16, side: 'left' }, // línea de hombros (acromion)
  { key: 'pecho', frac: 0.235, side: 'right' }, // pezones
  { key: 'ombligo', frac: 0.375, side: 'left' }, // ombligo
  { key: 'entrepierna', frac: 0.49, side: 'right' }, // pubis
  { key: 'rodillas', frac: 0.63, side: 'left' }, // rótulas
  { key: 'pantorrillas', frac: 0.74, side: 'right' }, // vientre de la pantorrilla
  { key: 'pies', frac: 0.93, side: 'left' }, // tobillos
]

export const CANON_LANDMARKS: Record<string, Landmark[]> = {
  // Académico — 7.5 cabezas (medido sobre la lámina).
  academic: MEASURED_ADULT,
  // Figura de 8 cabezas (heroico). Anatomía real del dibujo (medida).
  heroic: [
    { key: 'cabeza', frac: 0.12, side: 'left' }, // mentón
    { key: 'cuello', frac: 0.14, side: 'right' }, // base del cuello
    { key: 'hombros', frac: 0.16, side: 'left' }, // línea de hombros
    { key: 'pecho', frac: 0.24, side: 'right' }, // pezones
    { key: 'ombligo', frac: 0.39, side: 'left' }, // ombligo
    { key: 'entrepierna', frac: 0.48, side: 'right' }, // pubis
    { key: 'rodillas', frac: 0.64, side: 'left' }, // rótulas
    { key: 'pantorrillas', frac: 0.74, side: 'right' }, // vientre de la pantorrilla
    { key: 'pies', frac: 0.93, side: 'left' }, // tobillos
  ],
  // Cómic — la lámina salió con la misma proporción que la académica (medido).
  comic: MEASURED_ADULT,
}

// Femeninos: misma ALTURA que su contraparte por nº de cabezas (las alturas
// verticales las manda el headCount; la diferencia femenina es de ancho, no de
// altura). Se afinarán al medir las láminas reales.
CANON_LANDMARKS['academic-female'] = CANON_LANDMARKS.academic
CANON_LANDMARKS['heroic-female'] = CANON_LANDMARKS.heroic
CANON_LANDMARKS['comic-female'] = CANON_LANDMARKS.comic

// Override de landmarks POR VISTA (para la COLOCACIÓN visual de líneas/etiquetas
// cuando una lámina tenga proporciones propias). Vacío: todas las vistas heroicas
// usan la misma figura/proporciones (frontal.png · etc.). Las medidas en cm usan
// los landmarks del canon (`getLandmarks(canonId)` sin vista) → verdad única.
const CANON_VIEW_LANDMARKS: Record<string, Record<string, Landmark[]>> = {}

/** Landmarks de un canon (o de una VISTA si tiene override de colocación); cae a
 *  heroico mientras no haya medición propia. */
export function getLandmarks(canonId: string, view?: string): Landmark[] {
  if (view && CANON_VIEW_LANDMARKS[canonId]?.[view]) return CANON_VIEW_LANDMARKS[canonId][view]
  return CANON_LANDMARKS[canonId] ?? CANON_LANDMARKS.heroic
}

/**
 * Posiciones REALES de los landmarks desde la coronilla, en cm, a una altura
 * dada. Es la MISMA geometría que mide la regla (`frac · heightCm`) y que pinta
 * el chart → fuente única, replicable exacta (fidelidad P10). Escala lineal con
 * la altura. */
export function landmarkPositionsCm(canonId: string, heightCm: number): { key: string; cm: number; frac: number }[] {
  return getLandmarks(canonId).map((l) => ({ key: l.key, frac: l.frac, cm: l.frac * heightCm }))
}

/** Largos de los segmentos entre landmarks consecutivos (cm), del dibujo real. */
export function segmentLengthsCm(canonId: string, heightCm: number): { from: string; to: string; cm: number }[] {
  const pos = landmarkPositionsCm(canonId, heightCm)
  const out: { from: string; to: string; cm: number }[] = []
  for (let i = 1; i < pos.length; i++) out.push({ from: pos[i - 1].key, to: pos[i].key, cm: pos[i].cm - pos[i - 1].cm })
  return out
}

export interface DivisionMark {
  label: string
  /** Posición de la línea como fracción de la altura total (0..1). */
  frac: number
}

/** Marcas de división: una por cabeza entera (1..N) + la fracción final si la
 *  hay. Cada cabeza ocupa `1/headCount` de la altura → líneas equiespaciadas. */
export function divisionMarks(headCount: number): DivisionMark[] {
  const out: DivisionMark[] = []
  const full = Math.floor(headCount + 1e-9)
  for (let i = 1; i <= full; i++) out.push({ label: String(i), frac: i / headCount })
  if (headCount - full > 1e-9) out.push({ label: '½', frac: 1 })
  return out
}
