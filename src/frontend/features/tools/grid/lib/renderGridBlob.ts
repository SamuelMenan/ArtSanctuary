import { colLabel } from './colLabel'

export interface RenderGridParams {
  imageUrl: string
  /** Rectángulo en pantalla del marco (para mantener el mismo pan/zoom). */
  frameRect: { width: number }
  cols: number
  rows: number
  color: string
  opacity: number
  showNumbers: boolean
  zoom: number
  pan: { x: number; y: number }
}

// Lado largo máximo del export. Con celdas grandes (muchos cuadros) un canvas a
// 120px/celda llegaba a ~16000px → PNG de decenas de MB que disparaba 413 al
// subir y podía agotar memoria. Capamos el lado largo y comprimimos a WebP.
const MAX_EXPORT_DIM = 4096

/**
 * Renderiza la cuadrícula sobre la imagen en un canvas (hasta 120 px/celda, con
 * el lado largo topado en {@link MAX_EXPORT_DIM}) y devuelve un Blob WebP.
 * Reproduce el mismo contain + pan/zoom que en pantalla. Falla si la imagen
 * externa no tiene permiso CORS.
 */
export function renderGridBlob({
  imageUrl,
  frameRect,
  cols,
  rows,
  color,
  opacity,
  showNumbers,
  zoom,
  pan,
}: RenderGridParams): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Celda a 120px salvo que el lado largo exceda el tope: ahí se reduce para
    // que max(EW, EH) ≤ MAX_EXPORT_DIM (mínimo 16px para no perder legibilidad).
    const cellPx = Math.max(16, Math.min(120, Math.floor(MAX_EXPORT_DIM / Math.max(cols, rows))))
    const EW = cols * cellPx
    const EH = rows * cellPx
    const k = EW / frameRect.width // factor pantalla → export

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = EW
      canvas.height = EH
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('No ctx'))

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, EW, EH)

      // Imagen con el mismo contain + pan/zoom que en pantalla
      const containScale = Math.min(EW / img.naturalWidth, EH / img.naturalHeight)
      const dw = img.naturalWidth * containScale * zoom
      const dh = img.naturalHeight * containScale * zoom
      const dx = EW / 2 + pan.x * k - dw / 2
      const dy = EH / 2 + pan.y * k - dh / 2
      ctx.drawImage(img, dx, dy, dw, dh)

      ctx.strokeStyle = color
      ctx.globalAlpha = opacity / 100
      ctx.lineWidth = 1
      for (let c = 0; c <= cols; c++) {
        const x = Math.round((c * EW) / cols) + 0.5
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, EH)
        ctx.stroke()
      }
      for (let r = 0; r <= rows; r++) {
        const y = Math.round((r * EH) / rows) + 0.5
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(EW, y)
        ctx.stroke()
      }
      ctx.globalAlpha = 1

      if (showNumbers) {
        ctx.fillStyle = color
        ctx.globalAlpha = Math.min(1, opacity / 100 + 0.3)
        ctx.font = `${Math.round(cellPx / 6)}px monospace`
        ctx.textBaseline = 'top'
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            ctx.fillText(`${colLabel(c)}${r + 1}`, (c * EW) / cols + 4, (r * EH) / rows + 4)
          }
        }
        ctx.globalAlpha = 1
      }

      try {
        // Prod: WebP q0.82 (fondo blanco opaco, conserva nitidez de líneas y
        // deja el archivo muy por debajo del límite). Local: PNG lossless, sin
        // compresión. Ver docs/features/image-compression.md.
        const isProd = process.env.NODE_ENV === 'production'
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob)
            else reject(new Error('Blob failed'))
          },
          isProd ? 'image/webp' : 'image/png',
          isProd ? 0.82 : undefined,
        )
      } catch (e) {
        reject(e)
      }
    }
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = imageUrl
  })
}
