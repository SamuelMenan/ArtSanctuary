// Image/canvas helpers for the Crop and Background-removal tools.
// Plain Canvas 2D + Pica (alta calidad para el reescalado). CORS forzado para
// evitar canvas contaminado.

import { Pica } from 'pica'

const pica = new Pica()

// Tope de lado largo al subir. Suficiente para trazado/referencia y mantiene el
// payload bajo el límite de 4.5MB del edge de Vercel (causa de los 413).
const MAX_UPLOAD_DIM = 4096
// WebP: lossy para fotos/refs; casi-lossless para alpha (bordes de recortes).
const WEBP_QUALITY = 0.75
const WEBP_ALPHA_QUALITY = 0.95
// Por debajo de esto no recomprime (ya es chico, evita pérdida innecesaria).
const COMPRESS_SKIP_BELOW = 500 * 1024

export type CompressResult = {
  blob: Blob
  originalSize: number
  compressedSize: number
}

/** Loads an image as an HTMLImageElement (anonymous CORS so pixels are readable). */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load the image'))
    img.src = src
  })
}

/** Draws an image into a new canvas at its natural size and returns it. */
export function imageToCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No 2D context')
  ctx.drawImage(img, 0, 0)
  return canvas
}

/** Crops a region (image px) and returns a new canvas. */
export function cropCanvas(
  source: CanvasImageSource,
  rect: { x: number; y: number; w: number; h: number }
): HTMLCanvasElement {
  const out = document.createElement('canvas')
  out.width = Math.max(1, Math.round(rect.w))
  out.height = Math.max(1, Math.round(rect.h))
  const ctx = out.getContext('2d')
  if (!ctx) throw new Error('No 2D context')
  ctx.drawImage(source, rect.x, rect.y, rect.w, rect.h, 0, 0, out.width, out.height)
  return out
}

/** Canvas → Blob (PNG by default, preserves alpha). */
export function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/png', quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), type, quality)
  })
}

/** Downloads a Blob with the given filename. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** True if any pixel is non-opaque. Sale al primer pixel transparente. */
function detectAlpha(ctx: CanvasRenderingContext2D, w: number, h: number): boolean {
  const { data } = ctx.getImageData(0, 0, w, h)
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) return true
  }
  return false
}

/**
 * Comprime una imagen para subida: reescala a {@link MAX_UPLOAD_DIM} con Pica
 * (lanczos) y re-encodea a WebP. Detecta alpha → recortes usan q0.95 (bordes
 * casi limpios); fotos/refs usan q0.75.
 *  - GIF → passthrough (preserva animación; canvas la aplanaría).
 *  - <500KB → passthrough (evita recompresión con pérdida innecesaria).
 *  - Nunca devuelve un blob mayor que el original.
 * Ante cualquier fallo, devuelve el original (el server valida tamaño/tipo).
 */
export async function compressImage(input: Blob): Promise<CompressResult> {
  const originalSize = input.size
  const passthrough = { blob: input, originalSize, compressedSize: originalSize }

  if (input.type === 'image/gif' || input.size < COMPRESS_SKIP_BELOW) return passthrough

  const url = URL.createObjectURL(input)
  try {
    const img = await loadImage(url)
    let w = img.naturalWidth
    let h = img.naturalHeight
    if (w > MAX_UPLOAD_DIM || h > MAX_UPLOAD_DIM) {
      const r = Math.min(MAX_UPLOAD_DIM / w, MAX_UPLOAD_DIM / h)
      w = Math.round(w * r)
      h = Math.round(h * r)
    }

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    await pica.resize(img, canvas)

    const ctx = canvas.getContext('2d')
    if (!ctx) return passthrough

    const quality = detectAlpha(ctx, w, h) ? WEBP_ALPHA_QUALITY : WEBP_QUALITY
    const out = await canvasToBlob(canvas, 'image/webp', quality)

    // Nunca empeorar (p.ej. recorte de color plano donde PNG gana).
    if (out.size >= input.size) return passthrough
    return { blob: out, originalSize, compressedSize: out.size }
  } catch {
    return passthrough
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Sube un Blob YA comprimido a /api/upload. No recomprime. */
export async function uploadCompressedBlob(blob: Blob, filename = 'image'): Promise<string> {
  const type = blob.type || 'image/png'
  const ext = type === 'image/webp' ? 'webp' : type === 'image/png' ? 'png' : type === 'image/jpeg' ? 'jpg' : 'bin'
  const name = `${filename.replace(/\.\w+$/, '')}.${ext}`
  const fd = new FormData()
  fd.append('file', new File([blob], name, { type }))
  const res = await fetch('/api/upload', { method: 'POST', body: fd })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data?.error?.message ?? data.error ?? 'Failed to upload the image')
  }
  const data = await res.json()
  return data.imageUrl as string
}

/** Comprime (WebP, ≤4096px) y sube a /api/upload. Devuelve la URL pública. */
export async function uploadBlob(blob: Blob, filename = 'crop'): Promise<string> {
  const { blob: compressed } = await compressImage(blob)
  return uploadCompressedBlob(compressed, filename)
}
