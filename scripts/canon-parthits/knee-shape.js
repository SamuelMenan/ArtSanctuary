// knee-shape.js — Override de la RODILLA: hexágono alargado siguiendo las líneas de
// frontal.png (line-art), NO musculos.png. Inyecta el hexágono (izq + espejo der) en
// configs/heroic-frontal-final.json sobre la key `knee` (apply-frontal lo escribe en
// partHits). 6 vértices medidos a ojo sobre el dibujo; ajustar viendo el render.
// Uso: node knee-shape.js   (correr DESPUÉS de paint-frontal, ANTES de apply-frontal)
console.log("knee-shape.js: DESACTIVADO (Los músculos se trazan directamente de musculos.png sin aproximaciones geométricas)");
process.exit(0);

const fs = require('fs')
const path = require('path')
const F = path.join(__dirname, 'configs/heroic-frontal-final.json')
const j = JSON.parse(fs.readFileSync(F, 'utf8'))

// hexágono vertical de la rótula, pierna IZQUIERDA (figura-norm 0..1). Orden horario
// desde la punta superior (tendón cuádriceps) → vasto interno → afinado → punta inf
// (tendón rotuliano) → afinado → vasto externo.
const L = [
  [0.36, 0.62],   // top (tendón cuádriceps)
  [0.415, 0.665], // sup-int (vasto medial)
  [0.405, 0.72],  // inf-int
  [0.36, 0.758],  // bottom (tendón rotuliano)
  [0.315, 0.72],  // inf-ext
  [0.305, 0.665], // sup-ext (vasto lateral)
]
const mir = (pts) => pts.map(([x, y]) => [+(1 - x).toFixed(4), y]) // espejo en 0.5 → pierna derecha
const toPath = (pts) => 'M' + pts.map(([x, y]) => `${x} ${y}`).join(' L') + 'Z'

const R = mir(L)
const cx = +(L.reduce((s, p) => s + p[0], 0) / L.length).toFixed(4)
const cy = +(L.reduce((s, p) => s + p[1], 0) / L.length).toFixed(4)
j.knee = { path: toPath(L) + ' ' + toPath(R), cx, cy }
fs.writeFileSync(F, JSON.stringify(j, null, 2))
console.log('rodilla = hexágono inyectado (izq+der). cy', Math.min(...L.map((p) => p[1])).toFixed(3), '-', Math.max(...L.map((p) => p[1])).toFixed(3))
