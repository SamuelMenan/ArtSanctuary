// apply-frontal.js — regenera el bloque HEROIC_FRONTAL de partHits.ts a partir
// de configs/heroic-frontal-final.json (el DIBUJO del usuario musculos.png trazado
// por color → trace-frontal.js + assign-frontal.js). Reemplaza TODO el bloque
// (las claves cambian: +trapezius, sin hand). No toca POSTERIOR/LATERAL.
// Uso: node scripts/canon-parthits/apply-frontal.js
const path = require('path')
const fs = require('fs')
const J = require('./configs/heroic-frontal-final.json')
const F = path.join(__dirname, '../../src/shared/lib/canon/partHits.ts')

// orden de pintado (z): grandes primero; trapecio sobre cuello/hombro; rodilla al final.
// pelvis ELIMINADA del frontal (6.2): no es músculo; su superficie la toman abdomen/flank/thigh.
const ORDER = ['head', 'neck', 'shoulder', 'chest', 'trapezius', 'bicep', 'forearm', 'hand', 'abdomen', 'flank', 'thigh', 'leg', 'knee', 'foot']

const header = `// Mapa de músculos FRONTAL = DIBUJO del usuario (public/canon/heroic/musculos.png)
// TRAZADO POR COLOR (scripts/canon-parthits/{trace,assign}-frontal.js). La lámina
// frontal de heroico es \`musculosblanco.png\` (mismo encuadre) → el trazo calza
// pixel-perfect. Cada región = unión de los componentes de su color (subpaths
// M..Z; p.ej. el recto abdominal trae sus segmentos). Coords normalizadas a la
// imagen completa (0..1). No hay \`hand\` (sin colorear en el dibujo → degrada limpio).
const HEROIC_FRONTAL: PartHitMap = {
`
let body = ''
for (const k of ORDER) {
  if (!J[k]) { console.error('FALTA en final.json:', k); process.exit(1) }
  body += `  ${k}: {\n    path: '${J[k].path}',\n    cx: ${J[k].cx}, cy: ${J[k].cy},\n  },\n`
}
const block = header + body + '}\n\n'

let src = fs.readFileSync(F, 'utf8')
const start = src.indexOf('// Mapa de músculos FRONTAL')
const startConst = src.indexOf('const HEROIC_FRONTAL: PartHitMap = {')
const end = src.indexOf('// Heroico POSTERIOR')
if (startConst < 0 || end < 0) { console.error('no encontré los límites del bloque'); process.exit(1) }
const from = start >= 0 && start < startConst ? start : startConst // come el comentario viejo si existe
src = src.slice(0, from) + block + src.slice(end)
fs.writeFileSync(F, src)
console.log(`HEROIC_FRONTAL regenerado: ${ORDER.length} regiones (${ORDER.join(' ')})`)
