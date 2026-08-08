// extract-colors.js — Traza regiones posteriores desde el écorché coloreado
// (public/canon/heroic/referencia.png) clasificando por MATIZ (HSV) + ubicación.
//
// Pipeline: decodifica PNG (sharp) → bucket de matiz por píxel → componentes
// conexos por bucket → filtra por área → contorno (Moore) → RDP → normaliza a
// bbox de figura → asigna blob→músculo (bucket + centroide) → colors.json.
//
// Uso: node scripts/canon-parthits/extract-colors.js [view]
//   view = posterior (def) | frontal | lateral  → elige la lámina écorché.
const path = require('path')
const sharp = require('sharp')

// Lámina écorché a color por vista (mismo encuadre que la lámina limpia).
const REF_BY_VIEW = {
  posterior: 'referencia.png',
  frontal: 'referenciafrontal.png',
  lateral: 'refencialateral.png',
}
const VIEW = process.argv[2] || 'posterior'
const file = REF_BY_VIEW[VIEW]
if (!file) { console.error(`view inválida: ${VIEW} (posterior|frontal|lateral)`); process.exit(1) }
const REF = path.join(__dirname, '../../public/canon/heroic/', file)
const OUT = path.join(__dirname, `configs/heroic-${VIEW}-colors.json`)

// --- clasificación de matiz (igual que flatten.ps1 verificado) ---
function bucket(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn
  if (mx < 28) return 'bg'
  if (d < 22 && mx > 150) return 'white' // cabeza/manos sin saturar
  let h = 0
  if (d > 0) {
    if (mx === r) h = 60 * (((g - b) / d) % 6)
    else if (mx === g) h = 60 * ((b - r) / d + 2)
    else h = 60 * ((r - g) / d + 4)
  }
  if (h < 0) h += 360
  if (h >= 200 && h < 260) return 'blue'
  if (h >= 260 && h < 320) return 'purple'
  if (h >= 80 && h < 170) return 'green'
  if (h >= 20 && h < 45) return 'orange'
  if (h >= 0 && h < 20) return 'red'
  return 'salmon' // 320..360
}

async function main() {
  const img = sharp(REF)
  const { width: W, height: H } = await img.metadata()
  const buf = await img.raw().toBuffer() // RGBA o RGB
  const meta = await img.metadata()
  const ch = meta.channels // 3 ó 4
  const lab = new Int8Array(W * H) // -1 bg, 0..n bucket id
  const BUCKETS = ['blue', 'purple', 'green', 'orange', 'red', 'salmon', 'white', 'bg']
  const bid = Object.fromEntries(BUCKETS.map((b, i) => [b, i]))

  // bbox de figura (no-bg)
  let minx = W, maxx = 0, miny = H, maxy = 0
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) * ch
      const name = bucket(buf[o], buf[o + 1], buf[o + 2])
      lab[y * W + x] = bid[name]
      if (name !== 'bg') {
        if (x < minx) minx = x
        if (x > maxx) maxx = x
        if (y < miny) miny = y
        if (y > maxy) maxy = y
      }
    }
  }
  const fw = maxx - minx, fh = maxy - miny
  const nx = (x) => +((x - minx) / fw).toFixed(4)
  const ny = (y) => +((y - miny) / fh).toFixed(4)
  console.error(`bbox x=${minx}..${maxx} y=${miny}..${maxy} fw=${fw} fh=${fh}`)

  // componentes conexos (4-vec) por bucket, BFS
  const seen = new Uint8Array(W * H)
  const blobs = [] // {bucket, area, cx, cy, pixels:Set}
  const idx = (x, y) => y * W + x
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = idx(x, y)
      if (seen[i]) continue
      const b = lab[i]
      const bn = BUCKETS[b]
      if (bn === 'bg' || bn === 'white') { seen[i] = 1; continue }
      // BFS
      const stack = [i]; seen[i] = 1
      const px = []
      let sx = 0, sy = 0
      while (stack.length) {
        const c = stack.pop(); px.push(c)
        const cx = c % W, cy = (c / W) | 0
        sx += cx; sy += cy
        const nb = [[cx-1,cy],[cx+1,cy],[cx,cy-1],[cx,cy+1]]
        for (const [ax, ay] of nb) {
          if (ax < 0 || ay < 0 || ax >= W || ay >= H) continue
          const j = idx(ax, ay)
          if (!seen[j] && lab[j] === b) { seen[j] = 1; stack.push(j) }
        }
      }
      blobs.push({ bucket: bn, area: px.length, cx: sx / px.length, cy: sy / px.length, px })
    }
  }

  // filtro área mínima (ruido anti-alias)
  const MIN = (fw * fh) * 0.0012
  const big = blobs.filter((b) => b.area >= MIN).sort((a, b) => b.area - a.area)
  console.error(`blobs>=min(${MIN | 0}): ${big.length}`)
  for (const b of big.slice(0, 30)) {
    console.error(`  ${b.bucket.padEnd(7)} area=${b.area} cx=${nx(b.cx)} cy=${ny(b.cy)}`)
  }

  // --- contorno Moore-neighbor de un blob (set de píxeles) ---
  function contour(px) {
    const set = new Set(px)
    const has = (x, y) => set.has(idx(x, y))
    // start: píxel superior-izq
    let start = px[0]
    for (const p of px) { const py = (p / W) | 0, pxx = p % W; const sy = (start/W)|0, sxx = start%W; if (py < sy || (py === sy && pxx < sxx)) start = p }
    const sx = start % W, sy = (start / W) | 0
    const dirs = [[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]]
    const out = []
    let cx = sx, cy = sy, dir = 6
    let guard = 0, max = px.length * 8 + 16
    do {
      out.push([cx, cy])
      let found = false
      for (let k = 0; k < 8; k++) {
        const nd = (dir + 1 + k) % 8
        const ax = cx + dirs[nd][0], ay = cy + dirs[nd][1]
        if (has(ax, ay)) { cx = ax; cy = ay; dir = (nd + 4) % 8; found = true; break }
      }
      if (!found) break
      if (++guard > max) break
    } while (!(cx === sx && cy === sy))
    return out
  }

  // --- RDP ---
  function rdp(pts, eps) {
    if (pts.length < 3) return pts
    let dmax = 0, idxm = 0
    const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1]
    for (let i = 1; i < pts.length - 1; i++) {
      const [px, py] = pts[i]
      const dx = bx - ax, dy = by - ay
      const den = Math.hypot(dx, dy) || 1
      const dist = Math.abs(dy * px - dx * py + bx * ay - by * ax) / den
      if (dist > dmax) { dmax = dist; idxm = i }
    }
    if (dmax > eps) {
      const l = rdp(pts.slice(0, idxm + 1), eps)
      const r = rdp(pts.slice(idxm), eps)
      return l.slice(0, -1).concat(r)
    }
    return [pts[0], pts[pts.length - 1]]
  }

  // path normalizado
  function toPath(px) {
    const c = contour(px)
    const eps = Math.max(fw, fh) * 0.004
    const s = rdp(c, eps)
    if (s.length < 3) return null
    return 'M' + s.map(([x, y]) => `${nx(x)} ${ny(y)}`).join(' L') + 'Z'
  }

  // emitir todos los blobs grandes con su path (asignación músculo = manual en R2)
  const result = big.map((b) => ({
    bucket: b.bucket,
    cx: nx(b.cx), cy: ny(b.cy),
    area: +(b.area / (fw * fh)).toFixed(4),
    path: toPath(b.px),
  })).filter((b) => b.path)

  require('fs').writeFileSync(OUT, JSON.stringify(result, null, 2))
  console.error(`wrote ${OUT} (${result.length} regiones)`)
}
main().catch((e) => { console.error(e); process.exit(1) })
