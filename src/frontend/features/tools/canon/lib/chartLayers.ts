// Capas del sistema de referencia del chart de Canon. Separado de
// `ProportionChart.tsx` para que ese archivo solo exporte su componente
// (Fast Refresh / react-doctor only-export-components).

/** Capas del chart. Independientes: se ven por separado o combinadas.
 *  - canon / anatomy: dibujadas por código (siempre disponibles).
 *  - skeleton / muscles: láminas overlay extra por canon-vista (ver `overlays.ts`);
 *    el toggle solo aparece si hay asset.
 *  - joints: puntos de articulación posicionados por dato (ver `joints.ts`); el
 *    toggle solo aparece si hay data para el canon-vista. */
export interface ChartLayers {
  /** Capa Canon: divisiones geométricas (1/N), números y altura total. */
  canon: boolean
  /** Capa Anatomía: líneas + etiquetas de landmarks reales (frac medido). */
  anatomy: boolean
  /** Línea media + marcas de ancho (hombros/cintura/pelvis) sobre la figura. */
  widths: boolean
  /** Construcción Loomis (cabeza) + plomada (eje de aplomo vertical). */
  loomis: boolean
  /** Overlay de esqueleto (lámina extra). */
  skeleton: boolean
  /** Overlay de musculatura (lámina extra). */
  muscles: boolean
  /** Puntos de articulación (posición x,frac por dibujo). */
  joints: boolean
  /** Líneas guía de las fronteras entre masas de la espalda (solo posterior). */
  zones: boolean
}

/** Capas extra que dependen de assets/data (se ocultan si no hay). El orden es
 *  el de los toggles en la barra. */
export const EXTRA_LAYER_KEYS = ['skeleton', 'muscles', 'joints'] as const

// canon/anatomy ON por defecto (siempre dibujables); las extra OFF hasta que
// haya assets/data para no mostrar capas vacías.
export const DEFAULT_LAYERS: ChartLayers = {
  canon: true,
  anatomy: true,
  widths: false,
  loomis: false,
  skeleton: false,
  muscles: false,
  joints: false,
  zones: true,
}
