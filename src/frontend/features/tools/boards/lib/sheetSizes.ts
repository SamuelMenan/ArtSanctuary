// Catálogo de tamaños de hoja para exportar la imagen del board a PDF a escala.
// `wCm`/`hCm` son el tamaño FÍSICO de la hoja en vertical (portrait). El modal
// ofrece un toggle horizontal que intercambia w↔h al construir el PDF.
// jsPDF acepta `format: [wCm, hCm]` numérico → sirve para tamaños no estándar
// (pliego/medio pliego no son formatos integrados de jsPDF).

export interface SheetSize {
  id: string
  /** Clave i18n bajo `boards.` para el nombre visible. */
  labelKey: string
  /** Ancho (cm) en vertical. */
  wCm: number
  /** Alto (cm) en vertical. */
  hCm: number
}

// Orden: carta, pliegos, y luego el resto de formatos de impresora.
export const SHEET_SIZES: SheetSize[] = [
  { id: 'letter', labelKey: 'sheetLetter', wCm: 21.59, hCm: 27.94 },
  { id: 'cuarto-pliego', labelKey: 'sheetCuartoPliego', wCm: 50, hCm: 35 },
  { id: 'medio-pliego', labelKey: 'sheetMedioPliego', wCm: 70, hCm: 50 },
  { id: 'pliego', labelKey: 'sheetPliego', wCm: 70, hCm: 100 },
  { id: 'legal', labelKey: 'sheetLegal', wCm: 21.59, hCm: 35.56 },
  { id: 'tabloid', labelKey: 'sheetTabloid', wCm: 27.94, hCm: 43.18 },
  { id: 'a4', labelKey: 'sheetA4', wCm: 21.0, hCm: 29.7 },
  { id: 'a3', labelKey: 'sheetA3', wCm: 29.7, hCm: 42.0 },
  { id: 'a2', labelKey: 'sheetA2', wCm: 42.0, hCm: 59.4 },
  { id: 'a1', labelKey: 'sheetA1', wCm: 59.4, hCm: 84.1 },
  { id: 'a0', labelKey: 'sheetA0', wCm: 84.1, hCm: 118.9 },
  { id: 'foto', labelKey: 'sheetFoto', wCm: 10, hCm: 15 },
]

export const DEFAULT_SHEET: SheetSize = SHEET_SIZES.find((s) => s.id === 'letter')!
