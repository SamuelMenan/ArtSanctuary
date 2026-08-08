// paint-frontal.js — Traza el mapa de músculos FRONTAL del dibujo del usuario
// (public/canon/heroic/musculos.png, alineado con frontal.png) clasificando CADA
// PÍXEL a una región muscular por HUE + posición, no por bucket de color (así un
// músculo con sombreado no se fragmenta). Luego rellena las líneas negras
// (dilatación), saca el contorno de la máscara sólida de cada región y normaliza
// a la imagen (0..1) → calza sobre frontal.png. Salida directa:
// configs/heroic-frontal-final.json. Uso: node paint-frontal.js
const path = require('path')
const fs = require('fs')
const sharp = require('sharp')

const REF = path.join(__dirname, '../../public/canon/heroic/musculos.png')
const OUT = path.join(__dirname, 'configs/heroic-frontal-final.json')

function hsv(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn
  let h = 0
  if (d) { if (mx === r) h = 60 * (((g - b) / d) % 6); else if (mx === g) h = 60 * ((b - r) / d + 2); else h = 60 * ((r - g) / d + 4) }
  if (h < 0) h += 360
  return [h, d / mx || 0, mx]
}
// color + posición (cy,cx 0..1) + isArm (¿en una columna de BRAZO, separada del
// torso?) → key. Medido del dibujo: deltoides=azul, bíceps=verde-amarillo, antebrazo/
// mano=morado (en brazo), muslo/trapecio=morado (en cuerpo), pecho=crema, abdomen/
// rodilla=verde, cuello=rosa, gemelo=naranja, cabeza/flanco/pelvis=piel. El morado
// se separa por COLUMNA (brazo vs cuerpo), no por x → no confunde antebrazo con muslo.
function keyOf(r, g, b, cy, cx, isArm) {
  const [h, s, v] = hsv(r, g, b)
  if (v < 0.32 || s < 0.1) return null // línea negra / gris
  
  // ROSA (H >= 335 || H < 14) -> Neck (cuello)
  if (h >= 335 || h < 14) {
    if (cy > 0.22) return null
    // Restringir el cuello al centro para que no invada hombros
    if (cx >= 0.38 && cx <= 0.62) {
      return 'neck'
    }
    return null
  }
  
  // ORANGE / SKIN (H >= 14 && H < 34)
  if (h >= 14 && h < 34) {
    if (cy < 0.13) return 'head' // cabeza/cara
    if (cy > 0.70) return 'leg'  // gemelos/espinillas (naranja)
    if (isArm) return 'hand'     // manos (skin/orange)
    // Hombros/deltoides (orange) en los costados
    if (cy >= 0.11 && cy <= 0.28 && (cx < 0.35 || cx > 0.65)) return 'shoulder'
    return null
  }
  
  // CREMA / YELLOW (H >= 34 && H < 48)
  if (h >= 34 && h < 48) {
    if (cy < 0.16) return 'head' // cabeza/cara
    if (cy > 0.70) return 'leg' // shins/calves shading
    if (cy > 0.40) return null  // no chest in middle/lower body
    return 'chest' // pectorales
  }

  // LIME GREEN-YELLOW (H >= 48 && H < 90)
  if (h >= 48 && h < 90) {
    if (isArm || (cy >= 0.32 && cy <= 0.52 && (cx < 0.25 || cx > 0.75))) return 'forearm'
    return null
  }

  // GREEN (H >= 90 && H <= 155)
  if (h >= 90 && h <= 155) {
    return cy < 0.70 ? 'abdomen' : null
  }

  // CYAN / TEAL / BLUE-GREEN (H >= 155 && H < 185)
  if (h >= 155 && h < 185) {
    return 'flank' // oblicuos
  }

  // BLUE (H >= 185 && H <= 215)
  if (h >= 185 && h <= 215) {
    // Clasificar bicep en el brazo, incluso si cy < 0.30 está conectado
    if (isArm || (cy >= 0.22 && cy <= 0.45 && (cx < 0.25 || cx > 0.75))) return 'bicep'
    if (cy > 0.85) return 'foot'
    if (cy > 0.65 && cy < 0.80) return 'knee' // rodilla es azul
    return null
  }

  // PURPLE / LAVENDER (H >= 250 && H <= 320)
  if (h >= 250 && h <= 320) {
    if (isArm) return 'hand'
    if (cy < 0.22) return 'trapezius'
    
    // Pubis/Pelvis: reclassify purple pixels above the groin V-shape line-art
    const groinY = Math.max(0.495, 0.525 - 0.15 * Math.abs(cx - 0.50))
    if (cy < groinY) {
      if (cx < 0.36 || cx > 0.64) {
        return 'flank'
      }
      return 'abdomen'
    }
    
    return 'thigh' // muslos y pelvis
  }

  return null
}
const KEYS = ['head', 'neck', 'trapezius', 'shoulder', 'chest', 'bicep', 'forearm', 'hand', 'abdomen', 'flank', 'pelvis', 'thigh', 'knee', 'leg', 'foot']

async function main() {
  const { data: buf, info } = await sharp(REF).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: W, height: H } = info
  const at = (i) => { const o = i * 4; return [buf[o], buf[o + 1], buf[o + 2], buf[o + 3]] }
  const isBg = (i) => { const [r, g, b, a] = at(i); return a < 16 || (r > 238 && g > 238 && b > 238) }
  // fondo
  const bg = new Uint8Array(W * H); const st = []
  const push = (x, y) => { const i = y * W + x; if (!bg[i] && isBg(i)) { bg[i] = 1; st.push(i) } }
  for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1) }
  for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y) }
  while (st.length) { const i = st.pop(), x = i % W, y = (i / W) | 0; if (x) push(x - 1, y); if (x < W - 1) push(x + 1, y); if (y) push(x, y - 1); if (y < H - 1) push(x, y + 1) }
  // bbox figura
  let minx = W, maxx = 0, miny = H, maxy = 0
  for (let i = 0; i < W * H; i++) if (!bg[i]) { const x = i % W, y = (i / W) | 0; if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y }
  const fw = maxx - minx, fh = maxy - miny

  // ¿columna de BRAZO? Por fila: runs de figura; un run que NO cruza la línea media
  // (y en la banda axila..manos) es brazo/mano. Separa morado-de-brazo de morado-de-
  // muslo aunque la x se solape en la cadera.
  const mid = (minx + maxx) / 2
  const runsAt = (y) => { const r = []; let s = -1; for (let x = 0; x < W; x++) { const f = !bg[y * W + x]; if (f && s < 0) s = x; else if (!f && s >= 0) { r.push([s, x - 1]); s = -1 } } if (s >= 0) r.push([s, W - 1]); return r }
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
  // run de brazo (frac) que contiene a x en esa fila, o null (para la V del deltoides)
  const armRunAt = (x, y) => { const rs = armRows[y]; if (!rs) return null; for (const [a, b] of rs) if (x >= a && x <= b) return [a / W, b / W]; return null }

  // KEY por píxel (idx de KEYS, -1 = sin clasificar/línea)
  const lab = new Int16Array(W * H).fill(-1)
  for (let i = 0; i < W * H; i++) {
    if (bg[i]) continue
    const x = i % W, y = (i / W) | 0, [r, g, b] = at(i)
    const k = keyOf(r, g, b, y / H, x / W, isArm(x, y))
    const ki = k ? KEYS.indexOf(k) : -1
    if (ki >= 0) lab[i] = ki
  }
  // dilata las etiquetas sobre las líneas negras interiores (cierra huecos). Pocas
  // pasadas → no se desborda a zonas grandes oscuras (pelo) ni se "come" el contorno.
  for (let pass = 0; pass < 4; pass++) {
    const upd = []
    for (let y = miny; y <= maxy; y++) for (let x = minx; x <= maxx; x++) {
      const i = y * W + x
      if (lab[i] >= 0 || bg[i]) continue
      const cnt = {}
      for (const j of [i - 1, i + 1, i - W, i + W]) if (lab[j] >= 0) cnt[lab[j]] = (cnt[lab[j]] || 0) + 1
      let best = -1, bc = 0
      for (const k in cnt) if (cnt[k] > bc) { bc = cnt[k]; best = +k }
      if (best >= 0) upd.push([i, best])
    }
    if (!upd.length) break
    for (const [i, v] of upd) lab[i] = v
  }

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
  const eps = Math.max(fw, fh) * 0.0001
  const MIN = fw * fh * 0.0003
  const seen = new Uint8Array(W * H)
  const result = {}
  for (let ki = 0; ki < KEYS.length; ki++) {
    const subs = []; let bestC = null, bestA = 0
    for (let y = miny; y <= maxy; y++) {
      for (let x = minx; x <= maxx; x++) {
        const i = y * W + x
        if (lab[i] === ki && !seen[i]) {
          const px = []
          const q = [i]; seen[i] = 1
          while (q.length) {
            const cur = q.pop(); px.push(cur)
            const cx = cur % W, cy = (cur / W) | 0
            if (cx > 0 && lab[cur - 1] === ki && !seen[cur - 1]) { seen[cur - 1] = 1; q.push(cur - 1) }
            if (cx < W - 1 && lab[cur + 1] === ki && !seen[cur + 1]) { seen[cur + 1] = 1; q.push(cur + 1) }
            if (cy > 0 && lab[cur - W] === ki && !seen[cur - W]) { seen[cur - W] = 1; q.push(cur - W) }
            if (cy < H - 1 && lab[cur + W] === ki && !seen[cur + W]) { seen[cur + W] = 1; q.push(cur + W) }
          }
          if (px.length > MIN) {
            const p = contour(px)
            if (p.length > 2) {
              const r = rdp(p, eps)
              if (r.length > 2) {
                subs.push('M ' + r.map(([ax, ay]) => `${(ax / W).toFixed(4)} ${(ay / H).toFixed(4)}`).join(' L ') + ' Z')
                if (px.length > bestA) {
                  bestA = px.length
                  let sumx = 0, sumy = 0; for (const p of px) { sumx += p % W; sumy += (p / W) | 0 }
                  bestC = [+(sumx / px.length / W).toFixed(4), +(sumy / px.length / H).toFixed(4)]
                }
              }
            }
          }
        }
      }
    }
    if (subs.length) result[KEYS[ki]] = { path: subs.join(' '), cx: bestC[0], cy: bestC[1] }
  }
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2))
  console.error('regiones:', Object.keys(result).map((k) => `${k}(${result[k].path.split('M').length - 1})`).join(' '))
}
main().catch((e) => { console.error(e); process.exit(1) })
