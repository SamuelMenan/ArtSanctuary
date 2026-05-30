// Magic wand: makes contiguous pixels similar to the start point transparent
// (manual background removal for solid backgrounds). Operates on ImageData.

/**
 * Transparency flood-fill from (sx, sy).
 * @param tolerance 0–255: how much a pixel may differ from the start color.
 * Mutates `imageData` (sets alpha = 0 in the region). Returns pixels touched.
 */
export function floodErase(
  imageData: ImageData,
  sx: number,
  sy: number,
  tolerance = 30
): number {
  const { data, width: w, height: h } = imageData
  sx = Math.floor(sx)
  sy = Math.floor(sy)
  if (sx < 0 || sy < 0 || sx >= w || sy >= h) return 0

  const start = (sy * w + sx) * 4
  const r0 = data[start], g0 = data[start + 1], b0 = data[start + 2]
  const tol2 = tolerance * tolerance * 3

  const visited = new Uint8Array(w * h)
  const stack: number[] = [sy * w + sx]
  let count = 0

  while (stack.length) {
    const p = stack.pop()!
    if (visited[p]) continue
    visited[p] = 1
    const i = p * 4
    if (data[i + 3] === 0) continue // already transparent
    const dr = data[i] - r0
    const dg = data[i + 1] - g0
    const db = data[i + 2] - b0
    if (dr * dr + dg * dg + db * db > tol2) continue

    data[i + 3] = 0 // erase (transparent)
    count++

    const x = p % w
    const y = (p - x) / w
    if (x > 0) stack.push(p - 1)
    if (x < w - 1) stack.push(p + 1)
    if (y > 0) stack.push(p - w)
    if (y < h - 1) stack.push(p + w)
  }
  return count
}
