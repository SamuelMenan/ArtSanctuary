// Helpers de imagen/canvas para las herramientas de Recorte y Quitar fondo.
// Sin dependencias: Canvas 2D puro. CORS forzado para evitar tainted canvas.

/** Carga una imagen como HTMLImageElement (CORS anónimo para poder leer píxeles). */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'))
    img.src = src
  })
}

/** Dibuja una imagen en un canvas nuevo a su tamaño natural y devuelve el ctx. */
export function imageToCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Sin contexto 2D')
  ctx.drawImage(img, 0, 0)
  return canvas
}

/** Recorta una región (px de imagen) y devuelve un canvas nuevo. */
export function cropCanvas(
  source: CanvasImageSource,
  rect: { x: number; y: number; w: number; h: number }
): HTMLCanvasElement {
  const out = document.createElement('canvas')
  out.width = Math.max(1, Math.round(rect.w))
  out.height = Math.max(1, Math.round(rect.h))
  const ctx = out.getContext('2d')
  if (!ctx) throw new Error('Sin contexto 2D')
  ctx.drawImage(source, rect.x, rect.y, rect.w, rect.h, 0, 0, out.width, out.height)
  return out
}

/** Canvas → Blob (PNG por defecto, preserva alfa). */
export function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/png', quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob falló'))), type, quality)
  })
}

/** Descarga un Blob con un nombre dado. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Sube un Blob al endpoint /api/upload y devuelve la URL pública (Blob/local). */
export async function uploadBlob(blob: Blob, filename = 'recorte.png'): Promise<string> {
  const fd = new FormData()
  fd.append('file', new File([blob], filename, { type: blob.type || 'image/png' }))
  const res = await fetch('/api/upload', { method: 'POST', body: fd })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? 'Error al subir la imagen')
  }
  const data = await res.json()
  return data.imageUrl as string
}
