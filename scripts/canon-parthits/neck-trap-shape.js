// neck-trap-shape.js — Override del CUELLO y el TRAPECIO frontal (parte 1 del pulido
// fino). Problemas: el cuello subía a los lados hasta el maxilar ("se come la cabeza")
// y el trapecio era una cuña triangular rara. Aquí se definen como polígonos limpios,
// simétricos (lado izq + espejo en 0.5), medidos sobre frontal.png:
//  · CUELLO = columna con tope = mandíbula (compartido con head), lados que NO suben al
//    maxilar, base en la horquilla esternal.
//  · TRAPECIO = franja fina en la pendiente cuello→acromion (no triángulo que baja al pecho).
// Refine luego clipa/teja con prioridad (head>neck>trapezius>shoulder>chest).
// Uso: node neck-trap-shape.js   (DESPUÉS de head/knee-shape, ANTES de refine/apply)
const fs = require('fs')
const path = require('path')
const F = path.join(__dirname, 'configs/heroic-frontal-final.json')

const AX = 0.5
const mir = (p) => [+(2 * AX - p[0]).toFixed(4), +p[1].toFixed(4)]
const toPath = (pts) => 'M' + pts.map(([x, y]) => `${+x.toFixed(4)} ${+y.toFixed(4)}`).join(' L') + 'Z'
const cent = (pts) => { const sx = pts.reduce((s, p) => s + p[0], 0) / pts.length, sy = pts.reduce((s, p) => s + p[1], 0) / pts.length; return [+sx.toFixed(4), +sy.toFixed(4)] }

// --- CUELLO: chin (centro, top) → gonion izq → lado → base → centro-base, luego espejo ---
const chin = [0.50, 0.122]
const neckL = [
  chin,
  [0.437, 0.107],  // gonion izq (ángulo maxilar) — más bajo/adentro: NO sube al maxilar
  [0.430, 0.150],  // lado izq
  [0.452, 0.173],  // base izq (junto a clavícula)
  [0.50, 0.181],   // centro-base (horquilla esternal)
]
const neck = [...neckL, ...neckL.slice(1, -1).reverse().map(mir)]

// --- TRAPECIO izq: franja fina cuello→acromion, sobre la clavícula ---
const trapL = [
  [0.438, 0.116],  // inner-top (junto al cuello/cabeza)
  [0.242, 0.158],  // outer-top (cresta, hacia el acromion)
  [0.250, 0.172],  // outer-bottom (acromion/clavícula lateral)
  [0.452, 0.150],  // inner-bottom (franja FINA junto a la base del cuello)
]
const trap = trapL.concat() // izq
const trapR = trapL.map(mir)

const j = JSON.parse(fs.readFileSync(F, 'utf8'))
j.neck = { path: toPath(neck), cx: cent(neck)[0], cy: cent(neck)[1] }
j.trapezius = { path: toPath(trapL) + ' ' + toPath(trapR), cx: cent(trapL)[0], cy: cent(trapL)[1] }
fs.writeFileSync(F, JSON.stringify(j, null, 2))
console.log('cuello + trapecio (franja fina) inyectados, simétricos')
