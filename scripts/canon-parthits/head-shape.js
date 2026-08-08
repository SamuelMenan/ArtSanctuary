// head-shape.js — Override de la CABEZA: sigue el CONTORNO del line-art `frontal.png`
// (corona → ángulo del maxilar) y CIERRA con la curva de la MANDÍBULA (ángulo → mentón
// al centro, más bajo), NO con un corte recto (el recto en Y_JAW caía en el CUELLO →
// borde inclinado, defecto 6.3 del plan). Simétrico: mide el borde IZQ de la silueta y
// lo ESPEJA sobre el eje de la cabeza; el mentón está en el eje (punto compartido).
// Uso: node head-shape.js   (DESPUÉS de paint-frontal, ANTES de refine/apply)
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const PLATE = path.join(__dirname, '../../public/canon/heroic/frontal.png')
const F = path.join(__dirname, 'configs/heroic-frontal-final.json')
const Y_TOP = 0.004    // corona
const Y_ANGLE = 0.098  // bajado de 0.085 a 0.098 para cubrir el dibujo real de la mandíbula
const Y_CHIN = 0.128   // bajado de 0.115 a 0.128 para cubrir el mentón real

async function main() {
  console.log("head-shape.js: DESACTIVADO (Los músculos se trazan directamente de musculos.png sin aproximaciones geométricas)");
  return;
  const { data, info } = await sharp(PLATE).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: W, height: H } = info
  const isBg = (x, y) => { const o = (y * W + x) * 4; if (data[o + 3] < 16) return true; return data[o] > 238 && data[o + 1] > 238 && data[o + 2] > 238 }
  const edges = (yf) => { const y = Math.round(yf * H); let l = -1, r = -1; for (let x = 0; x < W; x++) if (!isBg(x, y)) { if (l < 0) l = x; r = x } return l < 0 ? null : [l / W, r / W] }

  // eje de la cabeza = promedio de los centros (la cabeza está un poco descentrada)
  let cs = 0, n = 0
  for (let yf = 0.02; yf < Y_ANGLE; yf += 0.01) { const e = edges(yf); if (e) { cs += (e[0] + e[1]) / 2; n++ } }
  const AX = cs / n

  // borde IZQ medido: corona → ángulo del maxilar (cráneo/cara real).
  const N = 14
  const left = []
  for (let i = 0; i <= N; i++) { const yf = Y_TOP + (Y_ANGLE - Y_TOP) * (i / N); const e = edges(yf); left.push([e ? e[0] : AX, yf]) }
  // curva de la MANDÍBULA: del ángulo del maxilar al mentón (eje, más bajo).
  // Se usa una curva paramétrica cóncava (tx, ty) para formar una U suave en lugar de V.
  const [xa, ya] = left[left.length - 1]
  const M = 12
  for (let i = 1; i <= M; i++) {
    const t = i / M
    const tx = Math.pow(t, 1.8) // X conserva la anchura más tiempo antes de ir al centro
    const ty = Math.pow(t, 0.6) // Y baja rápido al principio
    const x = xa + (AX - xa) * tx
    const y = ya + (Y_CHIN - ya) * ty
    left.push([x, y])
  }
  const mir = (p) => [+(2 * AX - p[0]).toFixed(4), +p[1].toFixed(4)]
  const toPath = (a) => 'M' + a.map(([x, y]) => `${+x.toFixed(4)} ${+y.toFixed(4)}`).join(' L') + 'Z'

  const leftHead = left.slice()
  const headPts = [...leftHead, ...leftHead.slice(0, -1).reverse().map(mir)]

  // --- CUELLO (Líneas rojas del usuario) ---
  const neckPts = []
  
  const jawIndex = leftHead.length - 1 - M
  const [jX, jY] = leftHead[jawIndex]
  
  // ASIMETRÍA: El lado derecho funciona perfecto con cXR = jX - 0.020
  // Pero en el lado izquierdo el cuello dibujado es más delgado. 
  // cXL = jX - 0.005 hace la base izquierda del cuello más estrecha, liberando espacio al trapecio.
  const cXR = jX - 0.020
  const cXL = jX - 0.005
  const cY = 0.170
  const Y_NOTCH = 0.185

  // 1. Mitad Izquierda del Cuello
  for (let i = 0; i <= M; i++) {
    const t = i / M
    const x = jX + (cXL - jX) * t
    const y = jY + (cY - jY) * Math.pow(t, 0.8)
    neckPts.push([x, y])
  }
  for (let i = 1; i <= M; i++) {
    const t = i / M
    const x = cXL + (AX - cXL) * t
    const y = cY + (Y_NOTCH - cY) * t
    neckPts.push([x, y])
  }
  
  // (No cerramos hacia el mentón todavía para evitar cortar el polígono a la mitad)
  
  // 2. Mitad Derecha del Cuello (usando cXR, idéntico a la versión anterior que funcionaba)
  const neckRightHalf = []
  for (let i = 0; i <= M; i++) {
    const t = i / M
    const x = jX + (cXR - jX) * t
    const y = jY + (cY - jY) * Math.pow(t, 0.8)
    neckRightHalf.push([x, y])
  }
  for (let i = 1; i <= M; i++) {
    const t = i / M
    const x = cXR + (AX - cXR) * t
    const y = cY + (Y_NOTCH - cY) * t
    neckRightHalf.push([x, y])
  }
  // Añadimos la mitad derecha en reversa (desde el centro hacia la mandíbula derecha)
  const rightMirrored = neckRightHalf.slice(0, -1).reverse().map(mir)
  neckPts.push(...rightMirrored)

  // Cierre seguro del cuello: subimos bien profundo dentro de la cabeza (Z=100 lo tapará)
  // Esto asegura que el polígono del cuello sea un solo bloque sólido sin rajaduras centrales
  neckPts.push([AX, 0.05])

  // --- TRAPECIOS (Línea morada del usuario) ---
  const trapLeft = []
  trapLeft.push([0.02, ya])
  // El trapecio izquierdo se comía el hombro con 0.170. Lo subimos a 0.155 para liberarlo.
  trapLeft.push([0.02, 0.155]) 
  trapLeft.push([cXL, cY])
  for (let i = M; i >= 0; i--) {
    const t = i / M
    const x = jX + (cXL - jX) * t
    const y = jY + (cY - jY) * Math.pow(t, 0.8)
    trapLeft.push([x, y])
  }
  for (let i = jawIndex; i >= leftHead.length - 1 - M; i--) {
    trapLeft.push(leftHead[i])
  }

  const trapRightHalf = []
  trapRightHalf.push([0.02, ya])
  // El trapecio derecho está perfecto en 0.145 según el usuario
  trapRightHalf.push([0.02, 0.145]) 
  trapRightHalf.push([cXR, cY])
  for (let i = M; i >= 0; i--) {
    const t = i / M
    const x = jX + (cXR - jX) * t
    const y = jY + (cY - jY) * Math.pow(t, 0.8)
    trapRightHalf.push([x, y])
  }
  for (let i = jawIndex; i >= leftHead.length - 1 - M; i--) {
    trapRightHalf.push(leftHead[i])
  }

  const trapRight = trapRightHalf.map(mir)
  const trapPath = toPath(trapLeft) + ' ' + toPath(trapRight)

  const j = JSON.parse(fs.readFileSync(F, 'utf8'))
  j.head = { path: toPath(headPts), cx: +AX.toFixed(4), cy: +((Y_TOP + Y_CHIN) / 2).toFixed(4) }
  j.neck = { path: toPath(neckPts), cx: +AX.toFixed(4), cy: 0.14 }
  j.trapezius = { path: trapPath, cx: +AX.toFixed(4), cy: 0.13 }
  fs.writeFileSync(F, JSON.stringify(j, null, 2))
  console.log(`cabeza = silueta corona→gonion(${Y_ANGLE}) + curva mandíbula→mentón(${Y_CHIN}), eje ${AX.toFixed(3)}, simétrica`)
}
main().catch((e) => { console.error(e); process.exit(1) })
