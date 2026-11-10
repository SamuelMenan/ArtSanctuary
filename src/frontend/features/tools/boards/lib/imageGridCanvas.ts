// Lienzo maestro compartido por las DOS descargas de una imagen del board
// (PNG y PDF a escala). Una sola fuente de verdad para la geometría: manda la
// medida física del objeto (`obj.w × obj.h` en cm, la del pie de página), no un
// múltiplo del cuadro. La cuadrícula son cuadros PERFECTOS de `gridCm` y la
// última columna/fila queda cortada si no cabe entera — igual que en el board
// (`nodes/ImageNode.tsx`) y que en la vida real.

import { colLabel } from '@frontend/features/tools/grid/lib/colLabel'

export interface ImageGridCanvasOpts {
  img: CanvasImageSource
  /** Medida física del objeto en el board (cm). Es la que manda. */
  wCm: number
  hCm: number
  /** Lado del cuadro (cm). */
  gridCm: number
  color: string
  /** Opacidad de líneas y números (0-100). */
  opacity: number
  showNumbers: boolean
  /** Con `false` sale la imagen limpia: ni líneas ni números. */
  showGrid: boolean
  /** Resolución del lienzo (px por cm). */
  pxPerCm: number
  /**
   * Extiende el lienzo hasta completar la última celda, rellenando de blanco.
   * Lo necesita el PDF para cortar las hojas justo por los cuadros. El PNG lo
   * deja en `false` para salir con la medida EXACTA de la imagen.
   */
  padToCell?: boolean
}

export interface ImageGridCanvas {
  canvas: HTMLCanvasElement
  cols: number
  rows: number
  /** Lado de la celda en px (float: las posiciones se redondean al usarlas). */
  cellPx: number
  /** Grosor de las líneas de la cuadrícula, en px. */
  lineWidth: number
  /** Tamaño del lienzo en px (con el relleno de `padToCell` ya aplicado). */
  width: number
  height: number
}

/** Etiqueta legible sólo si la celda da para tanto; si no, se omite. */
const MIN_LABEL_PX = { w: 25, h: 14 }

/**
 * Dibuja la imagen a su tamaño físico exacto y, si `showGrid`, le quema encima
 * la cuadrícula de cuadros exactos + las etiquetas A1/B1… Devuelve el lienzo
 * junto con la geometría, para que quien trocee en hojas use los mismos números.
 */
export function renderImageGridCanvas({
  img,
  wCm,
  hCm,
  gridCm,
  color,
  opacity,
  showNumbers,
  showGrid,
  pxPerCm,
  padToCell = false,
}: ImageGridCanvasOpts): ImageGridCanvas {
  const cols = Math.max(1, Math.ceil(wCm / gridCm))
  const rows = Math.max(1, Math.ceil(hCm / gridCm))
  const cellPx = gridCm * pxPerCm

  // Tamaño de la imagen y del lienzo. Sin `padToCell` coinciden: la descarga
  // mide exactamente lo que mide el objeto en el board.
  const imgW = Math.round(wCm * pxPerCm)
  const imgH = Math.round(hCm * pxPerCm)
  const W = padToCell ? Math.round(cols * cellPx) : imgW
  const H = padToCell ? Math.round(rows * cellPx) : imgH

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No 2d context')

  // Fondo blanco: cubre el sobrante de los cuadros incompletos (padToCell) y
  // deja opaco el PNG aunque la imagen tenga transparencia.
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)

  // La imagen se estira a la medida del objeto, como la dibuja Konva en el
  // board (width/height = obj.w/obj.h), para no perder un redimensionado libre.
  ctx.drawImage(img, 0, 0, imgW, imgH)

  const lineWidth = Math.max(1, pxPerCm * 0.05)

  // Borde suave del contorno de la imagen: la delimita aunque sea blanca y
  // marca por dónde cortar al montar las hojas.
  ctx.strokeStyle = '#bbbbbb'
  ctx.lineWidth = Math.max(1, pxPerCm * 0.02)
  ctx.strokeRect(0, 0, imgW, imgH)

  if (showGrid) {
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.globalAlpha = opacity / 100
    for (let i = 1; i < cols; i++) {
      const x = Math.round(i * cellPx)
      if (x >= W) break
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, H)
      ctx.stroke()
    }
    for (let j = 1; j < rows; j++) {
      const y = Math.round(j * cellPx)
      if (y >= H) break
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
      ctx.stroke()
    }
    ctx.strokeRect(0, 0, W, H)

    // Etiquetas dentro de cada celda (A1, B1, …).
    if (showNumbers) {
      const fs = Math.max(12, Math.round(cellPx / 5))
      ctx.fillStyle = color
      ctx.globalAlpha = Math.min(1, opacity / 100 + 0.3)
      ctx.font = `${fs}px monospace`
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const x = Math.round(i * cellPx)
          const y = Math.round(j * cellPx)
          // La última celda puede ir cortada: si no cabe la etiqueta, se omite.
          if (Math.min(W, Math.round((i + 1) * cellPx)) - x < MIN_LABEL_PX.w) continue
          if (Math.min(H, Math.round((j + 1) * cellPx)) - y < MIN_LABEL_PX.h) continue
          ctx.fillText(`${colLabel(i)}${j + 1}`, x + 6, y + 6)
        }
      }
    }
    ctx.globalAlpha = 1
  }

  return { canvas, cols, rows, cellPx, lineWidth, width: W, height: H }
}

// ── Descarga PNG/WebP ────────────────────────────────────────────────────────

// Lado largo máximo del PNG. Con imágenes grandes un lienzo a 120 px/celda
// llegaba a ~16000 px → archivo de decenas de MB. Se capa el lado largo.
const MAX_EXPORT_DIM = 4096
/** Resolución de partida: 120 px por celda (números legibles). */
const TARGET_PX_PER_CELL = 120

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = src
  })
}

/**
 * Descarga de la imagen (con o sin cuadrícula quemada) como Blob, a la medida
 * EXACTA del objeto en el board: sin relleno hasta el cuadro entero y sin
 * deformar la proporción. Falla si la imagen externa no tiene permiso CORS.
 */
export async function renderImageGridBlob(
  opts: Omit<ImageGridCanvasOpts, 'img' | 'pxPerCm' | 'padToCell'> & { src: string },
): Promise<Blob> {
  const img = await loadImage(opts.src)
  const longSideCm = Math.max(opts.wCm, opts.hCm, 0.01)
  const pxPerCm = Math.max(
    4,
    Math.min(TARGET_PX_PER_CELL / opts.gridCm, MAX_EXPORT_DIM / longSideCm),
  )
  const { canvas } = renderImageGridCanvas({ ...opts, img, pxPerCm })

  // Prod: WebP q0.82 (fondo blanco opaco, conserva la nitidez de las líneas y
  // deja el archivo muy por debajo del límite de subida). Local: PNG lossless.
  // Ver docs/features/image-compression.md.
  const isProd = process.env.NODE_ENV === 'production'
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Blob failed'))),
      isProd ? 'image/webp' : 'image/png',
      isProd ? 0.82 : undefined,
    )
  })
}
