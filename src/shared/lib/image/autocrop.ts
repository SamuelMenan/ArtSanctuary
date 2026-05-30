// Auto-crop: computes the bounding box of the real content.
//  - Image with alpha: extents of the non-transparent pixels.
//  - Image without alpha: extents of the pixels that differ from the border color.

export type Bounds = { x: number; y: number; w: number; h: number }

/** Does the image have meaningful transparency? (any pixel with alpha < 250) */
function hasAlpha(data: Uint8ClampedArray): boolean {
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 250) return true
  }
  return false
}

/** Average color of the 4 corners (for images without alpha). */
function borderColor(data: Uint8ClampedArray, w: number, h: number) {
  const corners = [0, (w - 1) * 4, (h - 1) * w * 4, ((h - 1) * w + (w - 1)) * 4]
  let r = 0, g = 0, b = 0
  for (const c of corners) {
    r += data[c]
    g += data[c + 1]
    b += data[c + 2]
  }
  return { r: r / 4, g: g / 4, b: b / 4 }
}

/**
 * Computes the content bounds.
 * @param tolerance 0–255 (no-alpha mode only): how much it may differ from the border.
 */
export function computeContentBounds(
  imageData: ImageData,
  tolerance = 18
): Bounds | null {
  const { data, width: w, height: h } = imageData
  const useAlpha = hasAlpha(data)
  const bc = useAlpha ? null : borderColor(data, w, h)
  const tol2 = tolerance * tolerance * 3 // squared distance in RGB

  let minX = w, minY = h, maxX = -1, maxY = -1

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      let content: boolean
      if (useAlpha) {
        content = data[i + 3] > 12
      } else {
        const dr = data[i] - bc!.r
        const dg = data[i + 1] - bc!.g
        const db = data[i + 2] - bc!.b
        content = dr * dr + dg * dg + db * db > tol2
      }
      if (content) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  if (maxX < minX || maxY < minY) return null // empty/uniform image
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
}

/** Applies padding (px) to a bounds, clamped to the image limits. */
export function padBounds(b: Bounds, pad: number, w: number, h: number): Bounds {
  const x = Math.max(0, b.x - pad)
  const y = Math.max(0, b.y - pad)
  return {
    x,
    y,
    w: Math.min(w - x, b.w + pad * 2 + (b.x - x)),
    h: Math.min(h - y, b.h + pad * 2 + (b.y - y)),
  }
}
