// Exporta el chart de Canon a PNG/PDF redibujándolo en un <canvas> con la MISMA
// matemática de `frac` que `ProportionChart`. Así el export es nítido a cualquier
// escala y no necesita html2canvas (solo jsPDF, que ya está en deps).

import { jsPDF } from 'jspdf'
import type { FigureModel } from '@shared/lib/canon/figure'
import { getLandmarks, divisionMarks } from '@shared/lib/canon/landmarks'
import { formatValue, type Unit } from '@shared/lib/canon/units'
import { figureSrc, type View } from './figureMeta'
import { boxWidthCm } from './figureGeom'
import { DEFAULT_LAYERS, type ChartLayers } from './chartLayers'

/** Función de i18n (acepta clave dinámica + vars). */
type T = (key: string, vars?: Record<string, string | number>) => string

export interface ExportArgs {
  figure: FigureModel
  view: View
  t: T
  /** Capas a incluir; por defecto todas. */
  layers?: ChartLayers
  /** Unidad de las medidas; por defecto cm. */
  unit?: Unit
  /** Multiplicador de resolución (nitidez). Por defecto 2. */
  scale?: number
}

// Layout base (px lógicos; se escalan por `scale`). La figura va en el centro.
const PAD = 40
const TITLE_H = 80
const LEFT = 250 // labels de landmarks (lado izquierdo)
const RIGHT = 280 // labels lado derecho + nº de división + bracket altura total

// Paleta fija (print-friendly; no depende de CSS vars del tema).
const COL = {
  bg: '#ffffff',
  ink: '#1a1a1a',
  muted: '#6b6b6b',
  accent: '#1769aa',
  division: 'rgba(0,0,0,0.22)',
  landmark: 'rgba(23,105,170,0.45)',
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** Dibuja el chart completo en un canvas nuevo y lo devuelve. */
export async function buildChartCanvas({ figure, view, t, layers = DEFAULT_LAYERS, unit = 'cm', scale = 2 }: ExportArgs): Promise<HTMLCanvasElement> {
  const { canonId, headCount, heightCm, headCm } = figure
  const u = t(`canon.units.${unit}`)
  const img = await loadImage(figureSrc(canonId, view))
  const imgW = img.naturalWidth
  const imgH = img.naturalHeight

  const W = PAD * 2 + LEFT + imgW + RIGHT
  const H = PAD * 2 + TITLE_H + imgH
  const figX = PAD + LEFT
  const figY = PAD + TITLE_H

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(W * scale)
  canvas.height = Math.round(H * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('no 2d context')
  ctx.scale(scale, scale)
  ctx.textBaseline = 'middle'

  // Fondo
  ctx.fillStyle = COL.bg
  ctx.fillRect(0, 0, W, H)

  // Título
  ctx.fillStyle = COL.ink
  ctx.font = '600 26px monospace'
  ctx.textAlign = 'center'
  ctx.fillText(t('canon.chartTitle', { n: headCount }), W / 2, PAD + TITLE_H / 2)

  // Figura
  ctx.drawImage(img, figX, figY, imgW, imgH)

  const yOf = (frac: number) => figY + frac * imgH

  // Columnas a la derecha de la figura: labels-derecha | nº división | bracket
  const rightLabelX = figX + imgW + 18 // labels de landmarks lado derecho (left-align)
  const divX = figX + imgW + 200 // números de división
  const bx = figX + imgW + 240 // bracket ALTURA TOTAL

  // Capa Canon: líneas de división (punteadas) + número
  if (layers.canon) {
    const divisions = divisionMarks(headCount)
    ctx.font = '18px monospace'
    for (const d of divisions) {
      const y = yOf(d.frac)
      ctx.strokeStyle = COL.division
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(figX, y)
      ctx.lineTo(figX + imgW, y)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = COL.muted
      ctx.textAlign = 'left'
      ctx.fillText(d.label, divX, y)
    }
  }

  // Capa Anatomía: líneas + etiquetas (nombre + cm) de landmarks reales
  if (layers.anatomy) {
    const landmarks = getLandmarks(canonId, view)
    for (const lm of landmarks) {
      const y = yOf(lm.frac)
      ctx.strokeStyle = COL.landmark
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(figX, y)
      ctx.lineTo(figX + imgW, y)
      ctx.stroke()

      const right = lm.side === 'right'
      ctx.textAlign = right ? 'left' : 'right'
      const tx = right ? rightLabelX : figX - 16
      ctx.fillStyle = COL.ink
      ctx.font = '600 18px monospace'
      ctx.fillText(t(`canon.landmarks.${lm.key}`).toUpperCase(), tx, y - 10)
      ctx.fillStyle = COL.accent
      ctx.font = '16px monospace'
      ctx.fillText(`${formatValue(lm.frac * heightCm, unit, headCm)} ${u}`, tx, y + 10)
    }
  }

  // Bracket ALTURA TOTAL (derecha del todo) — parte de la capa Canon
  if (layers.canon) {
    ctx.strokeStyle = COL.accent
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(bx, figY)
    ctx.lineTo(bx, figY + imgH)
    ctx.moveTo(bx, figY)
    ctx.lineTo(bx - 10, figY)
    ctx.moveTo(bx, figY + imgH)
    ctx.lineTo(bx - 10, figY + imgH)
    ctx.stroke()
    ctx.save()
    ctx.translate(bx + 22, figY + imgH / 2)
    ctx.rotate(Math.PI / 2)
    ctx.fillStyle = COL.accent
    ctx.font = '16px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(`${t('canon.alturaTotal').toUpperCase()} · ${formatValue(heightCm, unit, headCm)} ${u}`, 0, 0)
    ctx.restore()
  }

  return canvas
}

function triggerDownload(href: string, filename: string) {
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/** Exporta el chart como PNG de alta resolución. */
export async function exportChartPng(args: ExportArgs): Promise<void> {
  const canvas = await buildChartCanvas(args)
  const url = canvas.toDataURL('image/png')
  triggerDownload(url, `canon-${args.figure.canonId}-${args.view}.png`)
}

/** Exporta el chart como PDF (una página, orientación según el aspecto). */
export async function exportChartPdf(args: ExportArgs): Promise<void> {
  const canvas = await buildChartCanvas(args)
  const orientation = canvas.width >= canvas.height ? 'landscape' : 'portrait'
  const pdf = new jsPDF({ orientation, unit: 'pt', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  // Encajar manteniendo proporción, centrado, con margen.
  const margin = 24
  const maxW = pageW - margin * 2
  const maxH = pageH - margin * 2
  const ratio = Math.min(maxW / canvas.width, maxH / canvas.height)
  const w = canvas.width * ratio
  const h = canvas.height * ratio
  const x = (pageW - w) / 2
  const y = (pageH - h) / 2
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, w, h)
  pdf.save(`canon-${args.figure.canonId}-${args.view}.pdf`)
}

/** Exporta la lámina LIMPIA a escala REAL 1:1 (PDF en mm). La página mide
 *  exactamente el cuerpo (alto = heightCm, ancho = boxWidthCm) + un margen; al
 *  imprimir al 100% la figura sale a tamaño real. Sin anotaciones (solo la
 *  figura), para usarla como plantilla. */
export async function exportChartScalePdf({ figure, view }: Pick<ExportArgs, 'figure' | 'view'>): Promise<void> {
  const { canonId, heightCm } = figure
  const widthCm = boxWidthCm(canonId, view, heightCm)
  const img = await loadImage(figureSrc(canonId, view))
  const margin = 10 // mm
  const figW = widthCm * 10 // cm → mm
  const figH = heightCm * 10
  const pageW = figW + margin * 2
  const pageH = figH + margin * 2
  const pdf = new jsPDF({ orientation: pageH >= pageW ? 'portrait' : 'landscape', unit: 'mm', format: [pageW, pageH] })
  pdf.addImage(img, 'PNG', margin, margin, figW, figH)
  pdf.save(`canon-${canonId}-${view}-1a1.pdf`)
}
