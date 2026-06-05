// Exporta una imagen del board a PDF EXACTO para usarla como referencia física:
// la imagen (con su cuadrícula) se imprime a tamaño real (1:1 del boceto) y, si
// es más grande que una hoja carta, se trocea en varias hojas para unir. Añade
// una hoja con la escala: cuánto mide cada cuadro en la obra real.

import { cmOf, type Scaler } from '@shared/lib/measure'
import type { BoardObject } from '@shared/lib/boards/types'
import { colLabel } from '@frontend/features/tools/grid/lib/colLabel'

const LETTER_W_CM = 21.59 // carta (8.5")
const LETTER_H_CM = 27.94 // carta (11")
const MARGIN_CM = 1
const DPI = 150
const PXCM = DPI / 2.54 // px por cm a la resolución de render

const r1 = (n: number) => Math.round(n * 10) / 10

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** Lienzo maestro: la imagen + su cuadrícula EXACTA + números, a DPI alto. */
function renderMaster(img: HTMLImageElement, wCm: number, hCm: number, gridCm: number) {
  const cols = Math.ceil(wCm / gridCm)
  const rows = Math.ceil(hCm / gridCm)

  const cwPx = Math.round(gridCm * PXCM)
  const chPx = Math.round(gridCm * PXCM)

  const W = cols * cwPx
  const H = rows * chPx

  const cv = document.createElement('canvas')
  cv.width = W
  cv.height = H
  const ctx = cv.getContext('2d')
  if (!ctx) throw new Error('No 2d context')

  // Fondo negro para el sobrante de los cuadros incompletos
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, W, H)

  // Dibujar la imagen en su tamaño real (puede dejar franjas negras a la derecha/abajo)
  ctx.drawImage(img, 0, 0, wCm * PXCM, hCm * PXCM)

  // Cuadrícula interior
  ctx.strokeStyle = '#ef4444'
  ctx.lineWidth = Math.max(1, PXCM * 0.05)
  ctx.globalAlpha = 0.8
  for (let i = 1; i < cols; i++) {
    ctx.beginPath()
    ctx.moveTo(i * cwPx, 0)
    ctx.lineTo(i * cwPx, H)
    ctx.stroke()
  }
  for (let j = 1; j < rows; j++) {
    ctx.beginPath()
    ctx.moveTo(0, j * chPx)
    ctx.lineTo(W, j * chPx)
    ctx.stroke()
  }
  ctx.strokeRect(0, 0, W, H)

  // Etiquetas dentro de cada celda (A1, B1, etc.)
  const fs = Math.max(10, PXCM * 0.2)
  ctx.fillStyle = '#ef4444'
  ctx.globalAlpha = 0.8
  ctx.font = `${fs}px monospace`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const cellW = i === cols - 1 ? W - i * cwPx : cwPx
      const cellH = j === rows - 1 ? H - j * chPx : chPx
      if (cellW < 25 || cellH < 14) continue
      
      const cx = i * cwPx + 4
      const cy = j * chPx + 4
      ctx.fillText(`${colLabel(i)}${j + 1}`, cx, cy)
    }
  }
  ctx.globalAlpha = 1

  return cv
}

/**
 * Descarga la imagen seleccionada como PDF a escala real (1:1 del boceto),
 * troceada en hojas carta + hoja de escala. `scaler` da la medida en la obra.
 */
export async function exportImageGridPdf(obj: BoardObject, scaler: Scaler, name: string): Promise<void> {
  if (obj.type !== 'image' || !obj.src) return
  const img = await loadImage(obj.src)

  const wCm = cmOf(obj.w)
  const hCm = cmOf(obj.h)
  const gridCm = obj.gridCm && obj.gridCm > 0 ? obj.gridCm : 2
  const cols = Math.ceil(wCm / gridCm)
  const rows = Math.ceil(hCm / gridCm)

  const master = renderMaster(img, wCm, hCm, gridCm)

  const W_CM = cols * gridCm
  const H_CM = rows * gridCm

  // Calcular cuántos cuadros enteros caben por página
  const printW = LETTER_W_CM - 2 * MARGIN_CM
  const printH = LETTER_H_CM - 2 * MARGIN_CM
  const colsPerPage = Math.max(1, Math.floor(printW / gridCm))
  const rowsPerPage = Math.max(1, Math.floor(printH / gridCm))

  const pagesX = Math.ceil(cols / colsPerPage)
  const pagesY = Math.ceil(rows / rowsPerPage)

  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'cm', format: 'letter', orientation: 'portrait' })
  let first = true

  const cwPx = Math.round(gridCm * PXCM)
  const chPx = Math.round(gridCm * PXCM)
  const lw = Math.max(1, PXCM * 0.05)
  const halfLw = Math.ceil(lw / 2)

  const W_PX = cols * cwPx
  const H_PX = rows * chPx

  for (let py = 0; py < pagesY; py++) {
    for (let px = 0; px < pagesX; px++) {
      const startCol = px * colsPerPage
      const endCol = Math.min(cols, (px + 1) * colsPerPage)
      const startRow = py * rowsPerPage
      const endRow = Math.min(rows, (py + 1) * rowsPerPage)

      if (startCol >= cols || startRow >= rows) continue

      // Para no cortar la línea roja por el medio, la asignamos completamente
      // a la página anterior (derecha/abajo).
      const sx = startCol === 0 ? 0 : startCol * cwPx + halfLw
      const sy = startRow === 0 ? 0 : startRow * chPx + halfLw
      const ex = endCol === cols ? W_PX : endCol * cwPx + halfLw
      const ey = endRow === rows ? H_PX : endRow * chPx + halfLw

      const sw = ex - sx
      const sh = ey - sy
      if (sw <= 0 || sh <= 0) continue

      const tile = document.createElement('canvas')
      tile.width = sw
      tile.height = sh
      tile.getContext('2d')!.drawImage(master, sx, sy, sw, sh, 0, 0, sw, sh)

      if (!first) doc.addPage()
      first = false
      doc.setFontSize(8)
      doc.setTextColor(120)
      doc.text(`Col ${px + 1} / Fila ${py + 1}  ·  Imprime al 100%`, MARGIN_CM, MARGIN_CM - 0.3)
      doc.addImage(tile.toDataURL('image/png'), 'PNG', MARGIN_CM, MARGIN_CM, sw / PXCM, sh / PXCM)
    }
  }

  // Hoja de escala.
  doc.addPage()
  doc.setTextColor(20)
  doc.setFontSize(16)
  let y = 2.5
  doc.text(`${name || 'Imagen'} — Referencia para ampliar`, MARGIN_CM, y)
  doc.setFontSize(12)
  const ratioStr = Number.isInteger(scaler.ratio) ? `1:${scaler.ratio}` : `1:${scaler.ratio.toFixed(2)}`
  const lines = [
    `Escala ${ratioStr}`,
    `Boceto: ${r1(wCm)} × ${r1(hCm)} cm`,
    `Obra real: ${scaler.formatScaled(wCm)} × ${scaler.formatScaled(hCm)}`,
    `Cuadrícula: ${cols} columnas × ${rows} filas`,
    `Cada cuadro (entero): ${gridCm} × ${gridCm} cm (boceto)`,
    `            = ${scaler.formatScaled(gridCm)} × ${scaler.formatScaled(gridCm)} (obra)`,
    '',
    'INSTRUCCIONES DE ARMADO:',
    '1. Imprime al 100% (tamaño real, sin "ajustar a página").',
    '2. Los cortes están hechos EXACTAMENTE sobre los cuadros.',
    '3. La línea roja se dejó COMPLETA en el borde derecho e inferior de cada hoja.',
    '4. Corta el margen blanco (izquierdo/superior) de la hoja siguiente',
    '   al ras del dibujo y móntalo sobre la línea roja de la hoja anterior.',
  ]
  y += 1.2
  for (const l of lines) {
    doc.text(l, MARGIN_CM, y)
    y += 0.8
  }

  doc.save(`${(name || 'imagen').trim() || 'imagen'}-referencia.pdf`)
}
