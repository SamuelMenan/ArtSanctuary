// assign-posterior.js — Asigna los blobs de heroic-posterior-colors.json a
// músculos (bucket + ubicación del centroide) y empareja L/R en subpaths.
// Salida: heroic-posterior-final.json { <muscle>: {path, cx, cy} }.
const fs = require('fs')
const path = require('path')
const SRC = path.join(__dirname, 'configs/heroic-posterior-colors.json')
const OUT = path.join(__dirname, 'configs/heroic-posterior-final.json')
const blobs = JSON.parse(fs.readFileSync(SRC, 'utf8'))

// regla: (bucket, banda-y [min,max], opcional banda-x) -> músculo + pareado?
// el orden importa: primera regla que casa gana.
const RULES = [
  { m: 'neck',          bucket: 'green',  y: [0.05, 0.14], paired: false },
  { m: 'trapezius',     bucket: 'purple', y: [0.14, 0.26], paired: false },
  { m: 'shoulder',      bucket: 'orange', y: [0.14, 0.26], paired: true },
  { m: 'lats',          bucket: 'red',    y: [0.18, 0.28], paired: true },
  { m: 'infraspinatus', bucket: 'blue',   y: [0.25, 0.35], x: [0.2, 0.8], paired: true },
  { m: 'arm',           bucket: 'blue',   y: [0.22, 0.40], x: [0.0, 0.2], xOr: [0.8, 1.0], paired: true },
  { m: 'lumbar',        bucket: 'green',  y: [0.32, 0.44], paired: false },
  { m: 'forearm',       bucket: 'red',    y: [0.38, 0.46], x: [0.0, 0.2], xOr: [0.8, 1.0], paired: true },
  { m: 'gluteus',       bucket: 'red',    y: [0.42, 0.52], x: [0.35, 0.65], paired: false },
  { m: 'hamstring',     bucket: 'orange', y: [0.54, 0.66], paired: true },
  { m: 'popliteal',     bucket: 'blue',   y: [0.64, 0.72], paired: true },
  { m: 'calf',          bucket: 'green',  y: [0.74, 0.86], paired: true },
  { m: 'foot',          bucket: 'blue',   y: [0.94, 1.0], paired: true },
]

function inBand(v, [a, b]) { return v >= a && v < b }
function matchX(b, r) {
  if (!r.x) return true
  if (inBand(b.cx, r.x)) return true
  if (r.xOr && inBand(b.cx, r.xOr)) return true
  return false
}

const assigned = {}
for (const b of blobs) {
  for (const r of RULES) {
    if (b.bucket !== r.bucket) continue
    if (!inBand(b.cy, r.y)) continue
    if (!matchX(b, r)) continue
    ;(assigned[r.m] = assigned[r.m] || []).push(b)
    b._hit = true
    break
  }
  if (!b._hit) console.error(`UNASSIGNED ${b.bucket} cx=${b.cx} cy=${b.cy} area=${b.area}`)
}

// construir paths finales (centro: mayor blob; pareado: 2 mayores, orden por cx)
const result = {}
for (const [m, list] of Object.entries(assigned)) {
  const rule = RULES.find((r) => r.m === m)
  list.sort((a, b) => b.area - a.area)
  if (rule.paired) {
    const two = list.slice(0, 2).sort((a, b) => a.cx - b.cx)
    if (two.length < 2) { console.error(`WARN ${m}: solo ${two.length} blob (esperado par)`) }
    result[m] = {
      path: two.map((b) => b.path).join(' '),
      cx: +(two.reduce((s, b) => s + b.cx, 0) / two.length).toFixed(3),
      cy: +(two.reduce((s, b) => s + b.cy, 0) / two.length).toFixed(3),
    }
  } else {
    const b = list[0]
    result[m] = { path: b.path, cx: b.cx, cy: b.cy }
  }
}

// reporte cobertura
const want = RULES.map((r) => r.m)
const got = Object.keys(result)
console.error('asignados:', got.join(', '))
console.error('faltan:', want.filter((m) => !got.includes(m)).join(', ') || '(ninguno)')
fs.writeFileSync(OUT, JSON.stringify(result, null, 2))
console.error(`wrote ${OUT}`)
