// Capas del sistema dual de referencia del chart de Canon. Separado de
// `ProportionChart.tsx` para que ese archivo solo exporte su componente
// (Fast Refresh / react-doctor only-export-components).

/** Capas del sistema dual de referencia. Independientes: se ven por separado o
 *  ambas a la vez. */
export interface ChartLayers {
  /** Capa 1 — Canon: divisiones geométricas (1/N), números y altura total. */
  canon: boolean
  /** Capa 2 — Anatomía: líneas + etiquetas de landmarks reales (frac medido). */
  anatomy: boolean
}

export const DEFAULT_LAYERS: ChartLayers = { canon: true, anatomy: true }
