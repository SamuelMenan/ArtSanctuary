// refine-frontal.js — PASO FINAL del mapa frontal: rehace los BORDES en base
// frontal.png conservando la división actual. Lee los 15 paths de
// configs/heroic-frontal-final.json (división correcta), los rasteriza a UN
// label-map (1 etiqueta/píxel; solape → gana por PRIORIDAD), CLIPA a la silueta de
// frontal.png (nada se sale), rellena los huecos dirigido (etiqueta más cercana),
// y re-contornea el mapa ÚNICO (Moore+RDP). Bordes externos = silueta; internos =
// frontera compartida (una sola línea) → imposible solape/hueco. Sobrescribe
// final.json (luego: node apply-frontal.js). Plan: plan-canon-afinar-bordes-frontal.md
// Uso: node refine-frontal.js   (DESPUÉS de paint/knee/head-shape, ANTES de apply)
const path = require('path')
const fs = require('fs')
const sharp = require('sharp')

const PLATE = path.join(__dirname, '../../public/canon/heroic/frontal.png')
const F = path.join(__dirname, 'configs/heroic-frontal-final.json')
const VERIFY = path.join(__dirname, 'configs/refine-frontal-verify.png')

// Prioridad al solapar (mayor gana). De plan §3: head>neck · trapezius>shoulder>
// chest · knee>thigh>flank · pelvis>thigh. Brazos/pies solo clipan (orden neutro).
// NOTA: `pelvis` se ELIMINA del set frontal (no es un músculo, es hueso de
// origen/inserción — defecto 6.2). Sus píxeles quedan sin etiqueta y el relleno
// dirigido los reparte a abdomen/flank (oblicuos) y thigh (recto fem./sartorio/
// TFL/aductores). Posterior/lateral no se tocan.
const PRIO = {
  head: 100, knee: 95, neck: 92, trapezius: 88, shoulder: 80, chest: 70,
  hand: 58, forearm: 57, bicep: 56, abdomen: 50, thigh: 40, leg: 38, foot: 36,
  flank: 30,
}
// orden de re-contorneo / salida (mismo set que apply ORDER, sin z — el z lo pone apply)
const KEYS = ['head', 'neck', 'trapezius', 'shoulder', 'chest', 'bicep', 'forearm', 'hand', 'abdomen', 'flank', 'thigh', 'knee', 'leg', 'foot']
// color de verificación por key (render PURO)
const COL = {
  head: [210, 180, 140], neck: [120, 200, 120], trapezius: [150, 110, 200], shoulder: [240, 150, 90],
  chest: [220, 90, 90], bicep: [90, 160, 220], forearm: [200, 170, 110], hand: [120, 120, 120],
  abdomen: [240, 200, 80], flank: [180, 140, 100], pelvis: [200, 120, 180], thigh: [120, 90, 200],
  knee: [200, 160, 60], leg: [90, 200, 160], foot: [80, 140, 220],
}

async function main() {
  const { data, info } = await sharp(PLATE).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: W, height: H } = info
  const J = JSON.parse(fs.readFileSync(F, 'utf8'))

  // --- silueta de frontal.png (flood-fill del fondo desde el borde) ---
  const isBg0 = (i) => data[i * 4 + 3] < 16
  const bg = new Uint8Array(W * H); const st = []
  const push = (x, y) => { const i = y * W + x; if (!bg[i] && isBg0(i)) { bg[i] = 1; st.push(i) } }
  for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1) }
  for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y) }
  while (st.length) { const i = st.pop(), x = i % W, y = (i / W) | 0; if (x) push(x - 1, y); if (x < W - 1) push(x + 1, y); if (y) push(x, y - 1); if (y < H - 1) push(x, y + 1) }
  const inFig = (i) => !bg[i] // dentro de la silueta (interior encerrado cuenta)
  let minx = W, maxx = 0, miny = H, maxy = 0
  for (let i = 0; i < W * H; i++) if (inFig(i)) { const x = i % W, y = (i / W) | 0; if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y }
  const fw = maxx - minx, fh = maxy - miny

  const runsAt = (y) => { const r = []; let s = -1; for (let x = 0; x < W; x++) { const f = inFig(y * W + x); if (f && s < 0) s = x; else if (!f && s >= 0) { r.push([s, x - 1]); s = -1 } } if (s >= 0) r.push([s, W - 1]); return r }
  const armRows = []
  for (let y = 0; y < H; y++) {
    const cy = y / H
    if (cy < 0.22) { armRows.push(null); continue }
    const all = runsAt(y)
    let rs = []
    for (const [a, b] of all) {
      const c = (a + b) / 2 / W
      if (c < 0.25 || c > 0.75) {
        rs.push([a, b])
      }
    }
    armRows.push(rs.length ? rs : null)
  }
  const isArm = (x, y) => { const rs = armRows[y]; if (!rs) return false; for (const [a, b] of rs) if (x >= a && x <= b) return true; return false }

  // --- parse path → subpolígonos (px). Cada subpath M..Z = 1 polígono. ---
  function subpolys(d) {
    const polys = []
    for (const seg of d.split('M').slice(1)) {
      const nums = seg.replace(/Z/g, '').trim().split(/[ L]+/).map(Number).filter((n) => !Number.isNaN(n))
      const pts = []
      for (let i = 0; i + 1 < nums.length; i += 2) pts.push([nums[i] * W, nums[i + 1] * H])
      if (pts.length >= 3) polys.push(pts)
    }
    return polys
  }
  // relleno scanline (even-odd) de un polígono → callback(x,y)
  function fillPoly(pts, cb) {
    let ylo = Infinity, yhi = -Infinity
    for (const [, y] of pts) { if (y < ylo) ylo = y; if (y > yhi) yhi = y }
    ylo = Math.max(miny, Math.floor(ylo)); yhi = Math.min(maxy, Math.ceil(yhi))
    for (let y = ylo; y <= yhi; y++) {
      const yc = y + 0.5, xs = []
      for (let i = 0, n = pts.length; i < n; i++) {
        const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % n]
        if ((y1 <= yc && y2 > yc) || (y2 <= yc && y1 > yc)) xs.push(x1 + (yc - y1) / (y2 - y1) * (x2 - x1))
      }
      xs.sort((a, b) => a - b)
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const xa = Math.max(minx, Math.round(xs[k])), xb = Math.min(maxx, Math.round(xs[k + 1]))
        for (let x = xa; x < xb; x++) cb(x, y)
      }
    }
  }

  // --- sembrar label-map: pintar por PRIORIDAD ascendente (mayor sobrescribe) ---
  const isLine = (i) => {
    if (!inFig(i)) return false
    const x = i % W, y = (i / W) | 0
    if (isArm(x, y)) return false // No aplicar barreras de líneas internas en los brazos y manos
    
    // Ignore the briefs waistband line in the center as a barrier
    // (so abdomen/flank can flow past it and stop at the actual leg openings line-art)
    const cy = y / H, cx = x / W
    if (cy >= 0.475 && cy <= 0.505 && cx >= 0.40 && cx <= 0.60) {
      return false
    }
    
    const o = i * 4
    return data[o] < 150 && data[o+1] < 150 && data[o+2] < 150
  }
  const lab = new Int16Array(W * H).fill(-1)
  for (let i = 0; i < W * H; i++) {
    if (isLine(i)) lab[i] = -2
  }
  const order = KEYS.slice().sort((a, b) => (PRIO[a] || 0) - (PRIO[b] || 0))
  for (const k of order) {
    if (!J[k]) continue
    const ki = KEYS.indexOf(k)
    for (const poly of subpolys(J[k].path)) fillPoly(poly, (x, y) => {
      const i = y * W + x
      if (inFig(i) && lab[i] !== -2) lab[i] = ki
    })
  }

  // --- CLIP: fuera de la silueta → sin etiqueta ---
  for (let i = 0; i < W * H; i++) if (!inFig(i)) lab[i] = -1



  // --- 6.1 + B: carve de la BANDA de la rodilla (DESACTIVADO - usar dibujo musculos.png directamente) ---
  /*
  const KT = 0.642, KB = 0.716, HWn = 0.052     // lente: cy sup/inf + media-anchura (norm) ≈ rótula
  const SEAM0 = 0.700, SLOPE = 0.42             // borde thigh/leg: cy = SEAM0 + SLOPE·d (d = |x−centro pierna|)
  const BAND_LO = 0.60, BAND_HI = 0.77
  const KI_KNEE = KEYS.indexOf('knee'), KI_THIGH = KEYS.indexOf('thigh'), KI_LEG = KEYS.indexOf('leg')
  const runsAt = (y) => { const r = []; let s = -1; for (let x = minx; x <= maxx; x++) { const f = inFig(y * W + x); if (f && s < 0) s = x; else if (!f && s >= 0) { r.push([s, x - 1]); s = -1 } } if (s >= 0) r.push([s, maxx]); return r }
  for (let y = miny; y <= maxy; y++) {
    const cy = y / H
    if (cy < BAND_LO || cy > BAND_HI) continue
    const runs = runsAt(y).filter(([a, b]) => (b - a) > fw * 0.04) // descarta ruido/dedos
    if (runs.length !== 2) continue // necesita las 2 piernas ya separadas
    for (const [a, b] of runs) {
      const c = (a + b) / 2
      for (let x = a; x <= b; x++) {
        const i = y * W + x; if (!inFig(i)) continue
        const d = Math.abs(x - c) / W
        const half = (cy >= KT && cy <= KB) ? HWn * Math.sin(Math.PI * (cy - KT) / (KB - KT)) : 0
        if (d < half) { lab[i] = KI_KNEE; continue }
        lab[i] = cy < SEAM0 + SLOPE * d ? KI_THIGH : KI_LEG
      }
    }
  }
  */

  // --- RELLENO DIRIGIDO de huecos: BFS multi-fuente desde los píxeles etiquetados,
  // expandiendo a píxeles DENTRO de la silueta sin etiqueta → etiqueta más cercana.
  let q = []
  for (let i = 0; i < W * H; i++) if (lab[i] >= 0) q.push(i)
  
  const armKeys = ['bicep', 'forearm', 'hand']
  const armLabels = new Set(armKeys.map(k => KEYS.indexOf(k)))

  while (q.length) {
    const nq = []
    for (const i of q) {
      const x = i % W, y = (i / W) | 0, v = lab[i]
      const vIsArm = armLabels.has(v)
      for (const j of [i - 1, i + 1, i - W, i + W]) {
        if (j < 0 || j >= W * H) continue
        if (lab[j] === -1 && inFig(j)) {
          const jX = j % W, jY = (j / W) | 0
          const jIsArm = isArm(jX, jY)
          if (vIsArm === jIsArm) {
            lab[j] = v
            nq.push(j)
          }
        }
      }
    }
    q = nq
  }

  // --- SECOND BFS PASS: Fill all remaining gaps and line-art barriers inside the figure ---
  // This ensures 0 huecos inside the silhouette, making all muscles solid, gap-free blocks.
  let q2 = []
  for (let i = 0; i < W * H; i++) if (lab[i] >= 0) q2.push(i)
  
  while (q2.length) {
    const nq = []
    for (const i of q2) {
      const x = i % W, y = (i / W) | 0, v = lab[i]
      const vIsArm = armLabels.has(v)
      for (const j of [i - 1, i + 1, i - W, i + W]) {
        if (j < 0 || j >= W * H) continue
        if (lab[j] < 0 && inFig(j)) {
          const jX = j % W, jY = (j / W) | 0
          const jIsArm = isArm(jX, jY)
          if (vIsArm === jIsArm) {
            lab[j] = v
            nq.push(j)
          }
        }
      }
    }
    q2 = nq
  }

  // --- métricas de partición (deben dar 0 / 0 / 0) ---
  let holes = 0, outside = 0
  for (let i = 0; i < W * H; i++) { if (inFig(i) && lab[i] < 0) holes++; if (!inFig(i) && lab[i] >= 0) outside++ }
  // (solape = 0 por construcción: cada píxel tiene UNA etiqueta)

  // --- re-contornear el mapa ÚNICO (Moore + RDP), componentes conexos por key ---
  const nx = (x) => +(x / W).toFixed(4), ny = (y) => +(y / H).toFixed(4)
  const idx = (x, y) => y * W + x
  function contour(px) {
    const set = new Set(px); const has = (x, y) => set.has(idx(x, y))
    let start = px[0]; for (const p of px) { const py = (p / W) | 0, pxx = p % W, sy = (start / W) | 0, sxx = start % W; if (py < sy || (py === sy && pxx < sxx)) start = p }
    const sx = start % W, sy = (start / W) | 0
    const dirs = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]]
    const out = []; let cx = sx, cy = sy, dir = 6, guard = 0, max = px.length * 8 + 16
    do { out.push([cx, cy]); let found = false
      for (let k = 0; k < 8; k++) { const nd = (dir + 1 + k) % 8, ax = cx + dirs[nd][0], ay = cy + dirs[nd][1]; if (has(ax, ay)) { cx = ax; cy = ay; dir = (nd + 4) % 8; found = true; break } }
      if (!found) break; if (++guard > max) break
    } while (!(cx === sx && cy === sy))
    return out
  }
  function rdp(pts, eps) {
    if (pts.length < 3) return pts
    let dmax = 0, im = 0; const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1]
    for (let i = 1; i < pts.length - 1; i++) { const [px, py] = pts[i], dx = bx - ax, dy = by - ay, den = Math.hypot(dx, dy) || 1, dd = Math.abs(dy * px - dx * py + bx * ay - by * ax) / den; if (dd > dmax) { dmax = dd; im = i } }
    if (dmax > eps) return rdp(pts.slice(0, im + 1), eps).slice(0, -1).concat(rdp(pts.slice(im), eps))
    return [pts[0], pts[pts.length - 1]]
  }
  const eps = Math.max(fw, fh) * 0.0016 // Punto dulce (0.0016) para curvas suaves libres de dientes de sierra
  const MIN = fw * fh * 0.0002
  const seen = new Uint8Array(W * H)
  const result = {}
  for (let ki = 0; ki < KEYS.length; ki++) {
    const subs = []; let bestX = Infinity, bestC = null // ancla = componente MÁS A LA IZQ (estable en pareadas)
    for (let y = miny; y <= maxy; y++) for (let x = minx; x <= maxx; x++) {
      const i = idx(x, y)
      if (seen[i] || lab[i] !== ki) continue
      const stack = [i]; seen[i] = 1; const px = []
      while (stack.length) { const c = stack.pop(); px.push(c); const cx = c % W, cy = (c / W) | 0
        for (const [ax, ay] of [[cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]]) { if (ax < minx || ay < miny || ax > maxx || ay > maxy) continue; const j = idx(ax, ay); if (!seen[j] && lab[j] === ki) { seen[j] = 1; stack.push(j) } } }
      if (px.length < MIN) continue
      const c = rdp(contour(px), eps)
      if (c.length < 3) continue
      subs.push('M' + c.map(([x, y]) => `${nx(x)} ${ny(y)}`).join(' L') + 'Z')
      const sx = px.reduce((s, p) => s + p % W, 0) / px.length, sy = px.reduce((s, p) => s + ((p / W) | 0), 0) / px.length
      if (sx < bestX) { bestX = sx; bestC = [nx(sx), ny(sy)] }
    }
    if (subs.length) result[KEYS[ki]] = { path: subs.join(' '), cx: bestC[0], cy: bestC[1] }
  }

  // --- Δ vs estado anterior (centroide/área aprox por bbox-mask del label-map) ---
  fs.writeFileSync(F, JSON.stringify(result, null, 2))

  // --- render PURO de verificación (rellenos del label-map sobre blanco) ---
  const out = Buffer.alloc(W * H * 3, 255)
  for (let i = 0; i < W * H; i++) { const k = lab[i]; if (k >= 0) { const c = COL[KEYS[k]]; out[i * 3] = c[0]; out[i * 3 + 1] = c[1]; out[i * 3 + 2] = c[2] } }
  await sharp(out, { raw: { width: W, height: H, channels: 3 } }).png().toFile(VERIFY)

  const got = KEYS.filter((k) => result[k])
  const lost = KEYS.filter((k) => J[k] && !result[k])
  console.log(`refine OK · ${got.length}/${KEYS.length} regiones · huecos=${holes} fuera=${outside} (solape=0 por construcción)`)
  if (lost.length) console.log('PERDIDAS (area<MIN):', lost.join(' '))
  console.log('verify →', path.relative(process.cwd(), VERIFY))
}
main().catch((e) => { console.error(e); process.exit(1) })
