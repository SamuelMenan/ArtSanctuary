// Exporta una imagen del board a PDF EXACTO para usarla como referencia física:
// la imagen (con su cuadrícula) se imprime a tamaño real (1:1 del boceto) y, si
// es más grande que una hoja carta, se trocea en varias hojas para unir. Añade
// una hoja con la escala: cuánto mide cada cuadro en la obra real.

import { cmOf, type Scaler } from '@shared/lib/measure'
import type { BoardObject } from '@shared/lib/boards/types'
import { loadImage, renderImageGridCanvas } from './imageGridCanvas'
import { DEFAULT_SHEET, type SheetSize } from './sheetSizes'

const MARGIN_CM = 1
// Usamos 254 DPI porque equivale exactamente a 100 px/cm (100 / 2.54 = 39.37 * 2.54 = 100 px/cm).
// Al usar 100 px por centímetro de forma exacta, cualquier cuadrícula en cm (como 2cm) tendrá un tamaño exacto en píxeles.
// Esto elimina por completo cualquier error de redondeo (que acumulado da milímetros extra en la impresión) al exportar el PDF a escala.
const DPI = 254
const PXCM = 100 // px por cm

const r1 = (n: number) => Math.round(n * 10) / 10

export interface PdfOpts {
  /** Tamaño de hoja físico (default: carta). */
  sheet?: SheetSize
  /** Orientación horizontal: intercambia ancho↔alto de la hoja. */
  landscape?: boolean
  /** Margen de impresión en cm (default 1). */
  marginCm?: number
  /** Tamaño de celda (cm). Default: `obj.gridCm` o 2. */
  gridCm?: number
  /** Color de la cuadrícula y números. Default: '#ef4444' */
  color?: string
  /** Opacidad de la cuadrícula y números (0 a 100). Default: 80 */
  opacity?: number
  /** Si se muestran los números de columna y fila. Default: true */
  showNumbers?: boolean
  /** Si se quema la cuadrícula en las hojas. Con `false` el PDF sale a escala
   *  pero sin líneas ni números (el troceado por celdas no cambia). Default: true */
  showGrid?: boolean
}

/**
 * Descarga la imagen seleccionada como PDF a escala real (1:1 del boceto),
 * troceada en hojas del tamaño elegido + hoja de escala. `scaler` da la medida
 * en la obra. El tamaño de hoja y la orientación son configurables (§ pliego).
 */
export async function exportImageGridPdf(
  obj: BoardObject,
  scaler: Scaler,
  name: string,
  opts: PdfOpts = {},
): Promise<void> {
  if (obj.type !== 'image' || !obj.src) return
  const img = await loadImage(obj.src)

  const sheet = opts.sheet ?? DEFAULT_SHEET
  const margin = opts.marginCm ?? MARGIN_CM
  // Tamaño de página efectivo según orientación.
  const pageW = opts.landscape ? sheet.hCm : sheet.wCm
  const pageH = opts.landscape ? sheet.wCm : sheet.hCm

  const wCm = cmOf(obj.w)
  const hCm = cmOf(obj.h)
  const gridCm = opts.gridCm && opts.gridCm > 0 ? opts.gridCm : obj.gridCm && obj.gridCm > 0 ? obj.gridCm : 2
  const color = opts.color ?? '#ef4444'
  const opacity = opts.opacity ?? 80
  const showNumbers = opts.showNumbers ?? true
  const showGrid = opts.showGrid ?? true
  const cols = Math.ceil(wCm / gridCm)
  const rows = Math.ceil(hCm / gridCm)

  // El maestro manda: la imagen a su medida física exacta, con el lienzo
  // extendido hasta el cuadro entero para poder cortar las hojas por los cuadros.
  const { canvas: master, cellPx, lineWidth } = renderImageGridCanvas({
    img, wCm, hCm, gridCm, color, opacity, showNumbers, showGrid, pxPerCm: PXCM, padToCell: true,
  })

  // Calcular cuántos cuadros enteros caben por página
  const printW = pageW - 2 * margin
  const printH = pageH - 2 * margin
  const colsPerPage = Math.max(1, Math.floor(printW / gridCm))
  const rowsPerPage = Math.max(1, Math.floor(printH / gridCm))

  const pagesX = Math.ceil(cols / colsPerPage)
  const pagesY = Math.ceil(rows / rowsPerPage)

  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({
    unit: 'cm',
    format: [pageW, pageH],
    orientation: pageW > pageH ? 'landscape' : 'portrait',
    compress: true, // Compresión interna Flate (zlib) de streams sin pérdida de calidad (lossless)
  })
  let first = true

  // Sin cuadrícula no hay línea que salvar: el corte cae justo en el cuadro.
  const halfLw = showGrid ? Math.ceil(lineWidth / 2) : 0

  const W_PX = master.width
  const H_PX = master.height

  for (let py = 0; py < pagesY; py++) {
    for (let px = 0; px < pagesX; px++) {
      const startCol = px * colsPerPage
      const endCol = Math.min(cols, (px + 1) * colsPerPage)
      const startRow = py * rowsPerPage
      const endRow = Math.min(rows, (py + 1) * rowsPerPage)

      if (startCol >= cols || startRow >= rows) continue

      // Para no cortar la línea roja por el medio, la asignamos completamente
      // a la página anterior (derecha/abajo).
      const sx = startCol === 0 ? 0 : Math.round(startCol * cellPx) + halfLw
      const sy = startRow === 0 ? 0 : Math.round(startRow * cellPx) + halfLw
      const ex = endCol === cols ? W_PX : Math.round(endCol * cellPx) + halfLw
      const ey = endRow === rows ? H_PX : Math.round(endRow * cellPx) + halfLw

      const sw = ex - sx
      const sh = ey - sy
      if (sw <= 0 || sh <= 0) continue

      const tile = document.createElement('canvas')
      tile.width = sw
      tile.height = sh
      tile.getContext('2d')!.drawImage(master, sx, sy, sw, sh, 0, 0, sw, sh)

      if (!first) doc.addPage([pageW, pageH], pageW > pageH ? 'landscape' : 'portrait')
      first = false
      doc.setFontSize(8)
      doc.setTextColor(120)
      doc.text(`Col ${px + 1} / Fila ${py + 1}  ·  Imprime al 100%`, margin, margin - 0.3)
      doc.addImage(tile.toDataURL('image/png'), 'PNG', margin, margin, sw / PXCM, sh / PXCM, undefined, 'FAST')
    }
  }

  // Hoja de escala (solo si no es pliego).
  if (!sheet.id.includes('pliego')) {
    doc.addPage([pageW, pageH], pageW > pageH ? 'landscape' : 'portrait')
    doc.setTextColor(20)
    doc.setFontSize(16)
    let y = 2.5
    doc.text(`${name || 'Imagen'} — Referencia para ampliar`, margin, y)
    doc.setFontSize(12)
    const ratioStr = Number.isInteger(scaler.ratio) ? `1:${scaler.ratio}` : `1:${scaler.ratio.toFixed(2)}`
    const lines = [
      `Escala ${ratioStr}`,
      `Boceto: ${r1(wCm)} × ${r1(hCm)} cm`,
      `Obra real: ${scaler.formatScaled(wCm)} × ${scaler.formatScaled(hCm)}`,
      showGrid ? `Cuadrícula: ${cols} columnas × ${rows} filas` : 'Cuadrícula: sin cuadrícula (imagen limpia)',
      `Cada cuadro (entero): ${gridCm} × ${gridCm} cm (boceto)`,
      `            = ${scaler.formatScaled(gridCm)} × ${scaler.formatScaled(gridCm)} (obra)`,
      '',
      'INSTRUCCIONES DE ARMADO:',
      '1. Imprime al 100% (tamaño real, sin "ajustar a página").',
      '2. Los cortes están hechos EXACTAMENTE sobre los cuadros.',
      ...(showGrid
        ? [
            '3. La línea roja se dejó COMPLETA en el borde derecho e inferior de cada hoja.',
            '4. Corta el margen blanco (izquierdo/superior) de la hoja siguiente',
            '   al ras del dibujo y móntalo sobre la línea roja de la hoja anterior.',
          ]
        : [
            '3. Corta el margen blanco (izquierdo/superior) de la hoja siguiente',
            '   al ras del dibujo y móntalo sobre el borde de la hoja anterior.',
          ]),
    ]
    y += 1.2
    for (const l of lines) {
      doc.text(l, margin, y)
      y += 0.8
    }
  }

  const suffix = showGrid ? '' : '-sin-cuadricula'
  doc.save(`${(name || 'imagen').trim() || 'imagen'}-referencia-${sheet.id}${suffix}.pdf`)
}
