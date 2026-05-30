// Image/canvas helpers for the Crop and Background-removal tools.
// No dependencies: plain Canvas 2D. CORS forced to avoid a tainted canvas.

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

/** Uploads a Blob to /api/upload and returns the public URL (Blob/local). */
export async function uploadBlob(blob: Blob, filename = 'crop.png'): Promise<string> {
  const fd = new FormData()
  fd.append('file', new File([blob], filename, { type: blob.type || 'image/png' }))
  const res = await fetch('/api/upload', { method: 'POST', body: fd })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? 'Failed to upload the image')
  }
  const data = await res.json()
  return data.imageUrl as string
}
