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
export const CANON_LANDMARKS: Record<string, Landmark[]> = {
  // Figura de 8 cabezas (heroico). Anatomía real del dibujo.
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
}

/** Landmarks de un canon; cae a heroico mientras no haya medición propia. */
export function getLandmarks(canonId: string): Landmark[] {
  return CANON_LANDMARKS[canonId] ?? CANON_LANDMARKS.heroic
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
