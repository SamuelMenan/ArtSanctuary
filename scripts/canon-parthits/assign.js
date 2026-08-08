// assign.js — Asigna los blobs de heroic-<view>-colors.json a músculos según
// las REGLAS de `configs/heroic-<view>-assign.json` (bucket + banda-y + banda-x;
// empareja L/R si paired). Salida: heroic-<view>-final.json { <m>: {path,cx,cy} }.
//
// Uso: node scripts/canon-parthits/assign.js <view>   (frontal|lateral|posterior)
const fs = require('fs')
const path = require('path')

const VIEW = process.argv[2]
if (!VIEW) { console.error('uso: node assign.js <view>'); process.exit(1) }
const SRC = path.join(__dirname, `configs/heroic-${VIEW}-colors.json`)
const CFG = path.join(__dirname, `configs/heroic-${VIEW}-assign.json`)
const OUT = path.join(__dirname, `configs/heroic-${VIEW}-final.json`)

const blobs = JSON.parse(fs.readFileSync(SRC, 'utf8'))
const RULES = JSON.parse(fs.readFileSync(CFG, 'utf8'))

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

const result = {}
for (const [m, list] of Object.entries(assigned)) {
  const rule = RULES.find((r) => r.m === m)
  list.sort((a, b) => b.area - a.area)
  if (rule.paired) {
    const two = list.slice(0, 2).sort((a, b) => a.cx - b.cx)
    if (two.length < 2) console.error(`WARN ${m}: solo ${two.length} blob (esperado par)`)
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

const want = [...new Set(RULES.map((r) => r.m))]
const got = Object.keys(result)
console.error('asignados:', got.join(', '))
console.error('faltan:', want.filter((m) => !got.includes(m)).join(', ') || '(ninguno)')
fs.writeFileSync(OUT, JSON.stringify(result, null, 2))
console.error(`wrote ${OUT}`)
