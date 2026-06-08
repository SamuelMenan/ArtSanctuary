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
// Las alturas de academic/comic se PROYECTAN desde el set heroico medido,
// expresado en unidades-cabeza (frac·8): la parte superior (mentón→pubis) ocupa
// una cuota fija de cabezas, y el tramo de pierna (pubis→planta) se reescala a
// las cabezas que cada canon dedica a la pierna. Coherente con los `headCount`
// y diferenciado por canon; se reemplazará por medición directa cuando se haga
// la regla de píxeles sobre cada lámina.
export const CANON_LANDMARKS: Record<string, Landmark[]> = {
  // Académico — 7.5 cabezas.
  academic: [
    { key: 'cabeza', frac: 0.128, side: 'left' },
    { key: 'cuello', frac: 0.149, side: 'right' },
    { key: 'hombros', frac: 0.171, side: 'left' },
    { key: 'pecho', frac: 0.256, side: 'right' },
    { key: 'ombligo', frac: 0.416, side: 'left' },
    { key: 'entrepierna', frac: 0.512, side: 'right' },
    { key: 'rodillas', frac: 0.662, side: 'left' },
    { key: 'pantorrillas', frac: 0.756, side: 'right' },
    { key: 'pies', frac: 0.934, side: 'left' },
  ],
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
  // Cómic — 8.5 cabezas (piernas más largas → landmarks bajos suben de frac).
  comic: [
    { key: 'cabeza', frac: 0.113, side: 'left' },
    { key: 'cuello', frac: 0.132, side: 'right' },
    { key: 'hombros', frac: 0.151, side: 'left' },
    { key: 'pecho', frac: 0.226, side: 'right' },
    { key: 'ombligo', frac: 0.367, side: 'left' },
    { key: 'entrepierna', frac: 0.452, side: 'right' },
    { key: 'rodillas', frac: 0.621, side: 'left' },
    { key: 'pantorrillas', frac: 0.726, side: 'right' },
    { key: 'pies', frac: 0.926, side: 'left' },
  ],
}

// Femeninos: misma ALTURA que su contraparte por nº de cabezas (las alturas
// verticales las manda el headCount; la diferencia femenina es de ancho, no de
// altura). Se afinarán al medir las láminas reales.
CANON_LANDMARKS['academic-female'] = CANON_LANDMARKS.academic
CANON_LANDMARKS['heroic-female'] = CANON_LANDMARKS.heroic
CANON_LANDMARKS['comic-female'] = CANON_LANDMARKS.comic

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
