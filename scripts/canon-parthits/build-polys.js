// Construye polígonos por parte del cuerpo a partir de las runs de silueta.
// Pensado para vistas SIMÉTRICAS con brazos a los lados (frontal/posterior);
// el lateral traza los brazos a mano (ver README).
//
// Uso: node build-polys.js <runs.json> <config.json> <outDir>
//   config: { "cuts": { chin, torsoTop, armTop, elbow, waist, wrist, crotch, knee, ankle }, "step": 4 }
// Salida: <outDir>/polys.json (px, verificación) + <outDir>/paths.json (0..1, para partHits.ts)
const fs = require('fs')
const path = require('path')

const [, , runsFile, configFile, outDir] = process.argv
if (!runsFile || !configFile || !outDir) {
  console.error('uso: node build-polys.js <runs.json> <config.json> <outDir>')
  process.exit(1)
}
const { w, h, rows } = JSON.parse(fs.readFileSync(runsFile, 'utf8').replace(/^﻿/, ''))
const config = JSON.parse(fs.readFileSync(configFile, 'utf8').replace(/^﻿/, ''))
const { cuts, step: STEP = 4, bands = {} } = config

const F = (f) => Math.round(f * h) // frac → fila
const CX = w / 2

// Cortes declarados (frac de la altura; ver landmarks.ts del canon).
const { chin: CHIN, torsoTop: TORSO_TOP, armTop: ARM_TOP, elbow: ELBOW, waist: WAIST, wrist: WRIST, crotch: CROTCH, knee: KNEE, ankle: ANKLE } = cuts

// Cortes DETECTADOS de la propia silueta (override por config cuando el
// flood-fill no separa el brazo del torso, p. ej. posterior/lateral).
const ARMPIT_OPEN = cuts.armpitFrac ? F(cuts.armpitFrac) : findFirstRow3()
const HANDS_END = cuts.handsEndFrac ? F(cuts.handsEndFrac) : findHandsEnd()

function findFirstRow3() {
  for (let y = Math.round(0.2 * h); y < h; y++) if (rows[y].length >= 3) return y
  throw new Error('no se encontró fila con 3 runs; declara cuts.armpitFrac en el config')
}
function findHandsEnd() {
  let last = 0
  for (let y = Math.round(0.45 * h); y < Math.round(0.62 * h); y++) if (rows[y].length > 2) last = y
  return last
}

// Run que contiene (o es más cercana a) el centro.
function centerRun(y) {
  const rs = rows[y]
  if (!rs.length) return null
  let best = rs[0], bd = Infinity
  for (const r of rs) {
    const d = r[0] <= CX && CX <= r[1] ? 0 : Math.min(Math.abs(r[0] - CX), Math.abs(r[1] - CX))
    if (d < bd) { bd = d; best = r }
  }
  return best
}
// Bounding de las runs estrictamente fuera de la banda CENTRAL FIJA (la del
// pubis): inmune a que las piernas se partan dentro de la banda.
const CENTER_BAND = centerRun(Math.round(0.5 * h))
function sideBand(y, side) {
  const sel = rows[y].filter((r) => (side === 'L' ? r[1] < CENTER_BAND[0] : r[0] > CENTER_BAND[1]))
  if (!sel.length) return null
  return [Math.min(...sel.map((r) => r[0])), Math.max(...sel.map((r) => r[1]))]
}

// Frontera torso/brazo en la zona pegada (ARM_TOP..ARMPIT_OPEN): interpola entre
// el borde del run en el acromion y el borde del torso en la axila.
const yShoulder = F(ARM_TOP)
const shoulderRun = rows[yShoulder][0]
const armpitTorso = centerRun(ARMPIT_OPEN)
function torsoEdge(y, side) {
  const t = (y - yShoulder) / (ARMPIT_OPEN - yShoulder)
  return side === 'L'
    ? Math.round(shoulderRun[0] + (armpitTorso[0] - shoulderRun[0]) * t)
    : Math.round(shoulderRun[1] + (armpitTorso[1] - shoulderRun[1]) * t)
}

// ---- Recolección de spans por parte: cada parte = lista de {y, x0, x1} por lado.
// side: 'C' (única), 'L'/'R' (instancias pareadas).
function collect(part, topF, botF, fn) {
  const y0 = typeof topF === 'number' && topF < 2 ? F(topF) : topF
  const y1 = typeof botF === 'number' && botF < 2 ? F(botF) : botF
  const out = { C: [], L: [], R: [] }
  const ys = []
  for (let y = y0; y <= Math.min(y1, h - 1); y += STEP) ys.push(y)
  if (ys[ys.length - 1] !== Math.min(y1, h - 1)) ys.push(Math.min(y1, h - 1))
  for (const y of ys) {
    const spans = fn(y)
    if (!spans) continue
    for (const s of spans) if (s && s.x1 - s.x0 > 1) out[s.side].push({ y, x0: s.x0, x1: s.x1 })
  }
  return { part, spans: out }
}

const parts = []

// CABEZA: run única 0 → mentón.
parts.push(collect('head', 0, CHIN, (y) => {
  const r = rows[y][0]
  return r ? [{ side: 'C', x0: r[0], x1: r[1] }] : null
}))

// CUELLO: mentón → clavícula. Clampeado al ancho bajo el mentón (+margen) para
// no flarear a los trapecios.
const chinRun = centerRun(F(CHIN))
parts.push(collect('neck', CHIN, TORSO_TOP, (y) => {
  const r = centerRun(y)
  if (!r) return null
  return [{ side: 'C', x0: Math.max(r[0], chinRun[0] - 8), x1: Math.min(r[1], chinRun[1] + 8) }]
}))

// TORSO: clavícula → cintura. En zona pegada se recorta con torsoEdge.
// `symmetricTrunk` (posterior/lateral): cuando UN brazo va pegado al torso y el
// flood-fill no lo separa, el run central incluye ese brazo en un lado. Se toma
// el borde del lado LIMPIO (donde el brazo sí separó) y se espeja → tronco
// simétrico sin el brazo fusionado.
const SYM_TRUNK = config.symmetricTrunk === true
parts.push(collect('torso', TORSO_TOP, WAIST, (y) => {
  const c = centerRun(y)
  if (!c) return null
  if (SYM_TRUNK) {
    // TODO el tronco simétrico (el lado limpio = el más estrecho respecto al
    // centro; el contaminado por el brazo pegado es más ancho). Espejar el limpio
    // → la espalda no arrastra el brazo a NINGUNA altura.
    const half = Math.min(CX - c[0], c[1] - CX)
    return [{ side: 'C', x0: Math.round(CX - half), x1: Math.round(CX + half) }]
  }
  if (y < yShoulder || y >= ARMPIT_OPEN) return [{ side: 'C', x0: c[0], x1: c[1] }]
  return [{ side: 'C', x0: Math.max(c[0], torsoEdge(y, 'L')), x1: Math.min(c[1], torsoEdge(y, 'R')) }]
}))

// PELVIS: cintura → pubis (run central; las manos son runs laterales).
parts.push(collect('pelvis', WAIST, CROTCH, (y) => {
  const c = centerRun(y)
  if (!c) return null
  if (SYM_TRUNK) {
    const half = Math.min(CX - c[0], c[1] - CX)
    return [{ side: 'C', x0: Math.round(CX - half), x1: Math.round(CX + half) }]
  }
  return [{ side: 'C', x0: c[0], x1: c[1] }]
}))

// BRAZO (sup.): acromion → codo. Pegado: fuera de torsoEdge. Separado: bandas laterales.
parts.push(collect('arm', ARM_TOP, ELBOW, (y) => {
  if (y < ARMPIT_OPEN) {
    const r = centerRun(y)
    if (!r) return null
    return [
      { side: 'L', x0: r[0], x1: torsoEdge(y, 'L') },
      { side: 'R', x0: torsoEdge(y, 'R'), x1: r[1] },
    ]
  }
  const L = sideBand(y, 'L'), R = sideBand(y, 'R')
  return [L && { side: 'L', x0: L[0], x1: L[1] }, R && { side: 'R', x0: R[0], x1: R[1] }]
}))

// ANTEBRAZO: codo → muñeca (bandas laterales).
parts.push(collect('forearm', ELBOW, WRIST, (y) => {
  const L = sideBand(y, 'L'), R = sideBand(y, 'R')
  return [L && { side: 'L', x0: L[0], x1: L[1] }, R && { side: 'R', x0: R[0], x1: R[1] }]
}))

// MANO: muñeca → punta de dedos (bandas laterales; incluye pulgar).
parts.push(collect('hand', F(WRIST), HANDS_END, (y) => {
  const L = sideBand(y, 'L'), R = sideBand(y, 'R')
  return [L && { side: 'L', x0: L[0], x1: L[1] }, R && { side: 'R', x0: R[0], x1: R[1] }]
}))

// MUSLO: pubis → rodilla. Mientras los muslos van pegados (run única dentro de
// la banda central) se parte al medio; con 2 runs en la banda, cada run es un muslo.
const crotchRun = centerRun(F(CROTCH))
parts.push(collect('thigh', CROTCH, KNEE, (y) => {
  const legs = rows[y].filter((r) => r[0] >= crotchRun[0] - 6 && r[1] <= crotchRun[1] + 6)
  if (!legs.length) return null
  if (legs.length >= 2) {
    return [
      { side: 'L', x0: legs[0][0], x1: legs[0][1] },
      { side: 'R', x0: legs[legs.length - 1][0], x1: legs[legs.length - 1][1] },
    ]
  }
  const mid = Math.round((legs[0][0] + legs[0][1]) / 2)
  return [{ side: 'L', x0: legs[0][0], x1: mid }, { side: 'R', x0: mid, x1: legs[0][1] }]
}))

// PIERNA (inf.): rodilla → tobillo (2 runs).
parts.push(collect('leg', KNEE, ANKLE, (y) => {
  const rs = rows[y]
  if (rs.length < 2) return null
  return [
    { side: 'L', x0: rs[0][0], x1: rs[0][1] },
    { side: 'R', x0: rs[rs.length - 1][0], x1: rs[rs.length - 1][1] },
  ]
}))

// PIE: tobillo → planta (2 runs; última fila puede fragmentar en dedos → bbox por lado).
parts.push(collect('foot', ANKLE, 0.998, (y) => {
  const rs = rows[y]
  if (!rs.length) return null
  const L = rs.filter((r) => r[1] <= CX), R = rs.filter((r) => r[0] > CX)
  const bb = (s) => (s.length ? [Math.min(...s.map((r) => r[0])), Math.max(...s.map((r) => r[1]))] : null)
  const l = bb(L), r = bb(R)
  return [l && { side: 'L', x0: l[0], x1: l[1] }, r && { side: 'R', x0: r[0], x1: r[1] }]
}))

// ---- Bandas adicionales (articulaciones + deltoides), data-driven por config.
// Son franjas de `frac` SOBRE las partes grandes (las solapan); en `partHits.ts`
// se insertan DESPUÉS → pintan encima → ganan el hit-test (z-order del plan).
// modo: armPegado (deltoide, brazo aún unido al torso), sideLimb (brazo/antebrazo/
// mano ya separados), legs (las dos piernas), profileBand (perfil lateral).
function bandSpans(band, y) {
  // `frac` efectivo: si la banda da `fracTo`, interpola de `frac` (arriba) a
  // `fracTo` (abajo) a lo largo de la banda → la caja deja de ser un rectángulo
  // y se afina/ensancha siguiendo la espalda (no-caja).
  const bandFrac = (band, y) => {
    const f = band.frac ?? 0.6
    if (band.fracTo == null || band.from == null || band.to == null) return f
    const t = Math.max(0, Math.min(1, (y / h - band.from) / (band.to - band.from)))
    return f + (band.fracTo - f) * t
  }
  const mode = band.mode
  if (mode === 'spineBox') {
    // Caja CENTRAL de la columna (escápulas/romboides/dorsal): single centered
    // span clampeado a `frac` del medio-ancho LIMPIO → excluye los deltoides
    // (que van a la zona `shoulder`). Resuelve el bleed de la espalda a los brazos.
    const c = centerRun(y)
    if (!c) return null
    const cleanHalf = Math.min(CX - c[0], c[1] - CX)
    const half = cleanHalf * bandFrac(band, y)
    return [{ side: 'C', x0: Math.round(CX - half), x1: Math.round(CX + half) }]
  }
  if (mode === 'deltoidPost') {
    // Deltoides posteriores: los dos lóbulos FUERA de la caja de columna (entre
    // el borde de la columna y el borde del run). Pareado.
    const c = centerRun(y)
    if (!c) return null
    const cleanHalf = Math.min(CX - c[0], c[1] - CX)
    const spineHalf = cleanHalf * bandFrac(band, y)
    return [
      { side: 'L', x0: c[0], x1: Math.round(CX - spineHalf) },
      { side: 'R', x0: Math.round(CX + spineHalf), x1: c[1] },
    ]
  }
  if (mode === 'profileBand') {
    // Vista LATERAL: el perfil es UN solo run (brazo fundido con el torso, no
    // separable). Cada región = banda horizontal a toda la profundidad del
    // perfil (frente→espalda). Sigue el contorno real (no caja: bordes = silueta).
    const c = centerRun(y)
    return c ? [{ side: 'C', x0: c[0], x1: c[1] }] : null
  }
  if (mode === 'centerFull') {
    // Region central completa (cuello/nuca): centerRun clampeado al ancho bajo el
    // mentón para no flarear al trapecio.
    const c = centerRun(y)
    if (!c) return null
    return [{ side: 'C', x0: Math.max(c[0], chinRun[0] - 8), x1: Math.min(c[1], chinRun[1] + 8) }]
  }
  if (mode === 'centerSplit') {
    // Masa central partida en L/R (glúteos). Simétrica: toma el medio-ancho del
    // lado LIMPIO (el menor; el contaminado por la mano/brazo pegado es mayor) y
    // lo espeja → dos lóbulos sin la mano fusionada.
    const c = centerRun(y)
    if (!c) return null
    const half = Math.min(CX - c[0], c[1] - CX)
    const x0 = Math.round(CX - half), x1 = Math.round(CX + half), mid = Math.round(CX)
    return [{ side: 'L', x0, x1: mid }, { side: 'R', x0: mid, x1 }]
  }
  if (mode === 'trapSlope') {
    // Trapecio frontal: las dos pendientes hombro-cuello, flanqueando el cuello
    // (lateral al clamp del cuello, dentro del run ancho de los hombros).
    const c = centerRun(y)
    if (!c) return null
    const nl = chinRun[0] - 8, nr = chinRun[1] + 8
    return [
      { side: 'L', x0: c[0], x1: nl },
      { side: 'R', x0: nr, x1: c[1] },
    ]
  }
  if (mode === 'armPegado') {
    const c = centerRun(y)
    if (!c) return null
    return [
      { side: 'L', x0: c[0], x1: torsoEdge(y, 'L') },
      { side: 'R', x0: torsoEdge(y, 'R'), x1: c[1] },
    ]
  }
  if (mode === 'sideLimb') {
    const L = sideBand(y, 'L'), R = sideBand(y, 'R')
    return [L && { side: 'L', x0: L[0], x1: L[1] }, R && { side: 'R', x0: R[0], x1: R[1] }]
  }
  if (mode === 'legs') {
    const rs = rows[y]
    if (rs.length < 2) return null
    return [
      { side: 'L', x0: rs[0][0], x1: rs[0][1] },
      { side: 'R', x0: rs[rs.length - 1][0], x1: rs[rs.length - 1][1] },
    ]
  }
  return null
}
// Una banda se ubica de dos formas:
//  - ANCLADA a un landmark (recomendado): { anchor:'rodillas', offset?, half? }
//    → centro = landmarks[anchor] + offset; ventana = centro ± half. Como los
//    landmarks son por canon-vista, la banda se AUTO-CORRIGE en cada lámina
//    (no se teclean `frac`). offset = ajuste fino relativo (sigue al landmark);
//    half = media altura (longitud de la banda).
//  - explícita: { from, to } (para spans que no son una articulación, p. ej.
//    el deltoide o el trapecio).
// Partes hardcoded reemplazadas por bandas (p. ej. `torso`→scapula/upperBack/lats,
// `neck`→nape/neck): `config.skipParts` las descarta ANTES de añadir las bandas
// para que no colisionen por nombre.
if (Array.isArray(config.skipParts) && config.skipParts.length) {
  const skip = new Set(config.skipParts)
  for (let i = parts.length - 1; i >= 0; i--) if (skip.has(parts[i].part)) parts.splice(i, 1)
}

const landmarks = config.landmarks ?? {}
for (const [name, band] of Object.entries(bands)) {
  let from = band.from, to = band.to
  if (band.anchor) {
    const a = landmarks[band.anchor]
    if (a == null) throw new Error(`banda ${name}: landmark '${band.anchor}' no está en config.landmarks`)
    const c = a + (band.offset ?? 0)
    const half = band.half ?? 0.02
    from = c - half
    to = c + half
  }
  parts.push(collect(name, from, to, (y) => bandSpans(band, y)))
}

// ---- Espejo: cuando un lado de una parte pareada quedó incompleto (brazo
// pegado al torso que el flood-fill no separa), reflejar el lado bueno al malo
// (figura bilateralmente simétrica). `config.mirror: "auto"`.
if (config.mirror === 'auto') {
  const mir = (spans) => spans.map((s) => ({ y: s.y, x0: w - s.x1, x1: w - s.x0 }))
  for (const p of parts) {
    const L = p.spans.L, R = p.spans.R
    if (!L.length && !R.length) continue
    const ratio = Math.min(L.length, R.length) / (Math.max(L.length, R.length) || 1)
    if (L.length && R.length && ratio > 0.6) continue // ambos OK, no tocar
    if (R.length >= L.length) p.spans.L = mir(R)
    else p.spans.R = mir(L)
  }
}

// ---- Spans → polígono (borde izq ↓, borde der ↑) + simplificación RDP.
function rdp(pts, eps) {
  if (pts.length < 3) return pts
  let maxD = 0, idx = 0
  const [a, b] = [pts[0], pts[pts.length - 1]]
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const len = Math.hypot(dx, dy) || 1
  for (let i = 1; i < pts.length - 1; i++) {
    const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + b[0] * a[1] - b[1] * a[0]) / len
    if (d > maxD) { maxD = d; idx = i }
  }
  if (maxD <= eps) return [a, b]
  return [...rdp(pts.slice(0, idx + 1), eps).slice(0, -1), ...rdp(pts.slice(idx), eps)]
}

function spansToPoly(spans) {
  if (spans.length < 2) return null
  const left = spans.map((s) => [s.x0, s.y])
  const right = spans.map((s) => [s.x1 + 1, s.y]).reverse()
  return [...rdp(left, 1.5), ...rdp(right, 1.5)]
}

const polys = [] // { part, side, pts:[[x,y]...] } en px
for (const { part, spans } of parts) {
  for (const side of ['C', 'L', 'R']) {
    const poly = spansToPoly(spans[side])
    if (poly) polys.push({ part, side, pts: poly })
  }
}

// paths.json: normalizado 0..1 (4 decimales) + ancla por parte.
const norm = (x, y) => [+(x / w).toFixed(4), +(y / h).toFixed(4)]
const out = {}
for (const { part, side, pts } of polys) {
  const d = 'M' + pts.map(([x, y]) => norm(x, y).join(' ')).join(' L') + ' Z'
  if (!out[part]) out[part] = { subs: [], anchor: null }
  out[part].subs.push(d)
  if (!out[part].anchor || side === 'L' || side === 'C') {
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length
    const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length
    out[part].anchor = norm(cx, cy)
  }
}
const final = Object.fromEntries(
  Object.entries(out).map(([k, v]) => [k, { path: v.subs.join(' '), cx: v.anchor[0], cy: v.anchor[1] }]),
)
fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(path.join(outDir, 'polys.json'), JSON.stringify(polys))
fs.writeFileSync(path.join(outDir, 'paths.json'), JSON.stringify(final, null, 2))
console.log('detectado:', { ARMPIT_OPEN, armpitFrac: +(ARMPIT_OPEN / h).toFixed(3), HANDS_END, handsFrac: +(HANDS_END / h).toFixed(3) })
console.log('polys:', polys.map((p) => `${p.part}/${p.side}:${p.pts.length}pts`).join(' '))
