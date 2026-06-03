// Figura humana reglamentaria (Fase 4 — integración Canon).
// Reutiliza la silueta proporcional de Canon (7.5 cabezas, viewBox 200×750) y
// la expone como data-URL SVG inyectable en un Board, escalada para que la
// medida pies→hombros coincida con la referencia oficial (15 cm hasta hombros).

// En el viewBox 0..750 (de arriba abajo): hombros ≈ y=120, pies = y=750.
const SHOULDER_Y = 120
const FOOT_Y = 750
const VIEW_W = 200
const VIEW_H = 750

/** Proporción pies→hombros respecto a la altura total de la silueta. */
export const FEET_TO_SHOULDER_RATIO = (FOOT_Y - SHOULDER_Y) / VIEW_H // 0.84

/**
 * Tamaño físico (cm de boceto) de la silueta completa para que el tramo
 * pies→hombros mida `shouldersCm` (la referencia reglamentaria, p. ej. 15 cm).
 */
export function humanFigureSizeCm(shouldersCm: number): { wCm: number; hCm: number } {
  const hCm = shouldersCm / FEET_TO_SHOULDER_RATIO
  const wCm = (VIEW_W / VIEW_H) * hCm
  return { wCm, hCm }
}

const PATHS = [
  // Brazos (tras el torso)
  'M40 120 L15 160 L25 300 L35 450 L50 450 L45 300 L60 200 Z',
  'M160 120 L185 160 L175 300 L165 450 L150 450 L155 300 L140 200 Z',
  // Cabeza
  'M100 0 C130 0 135 40 135 60 C135 85 115 100 100 100 C85 100 65 85 65 60 C65 40 70 0 100 0 Z',
  // Tórax
  'M100 100 C110 100 115 110 115 120 L160 120 C175 120 180 140 170 160 C160 180 150 200 140 200 L60 200 C50 200 40 180 30 160 C20 140 25 120 40 120 L85 120 C85 110 90 100 100 100 Z',
  // Abdomen
  'M60 200 L140 200 L135 250 L145 300 L55 300 L65 250 Z',
  // Pelvis
  'M55 300 L145 300 L160 360 L100 400 L40 360 Z',
  // Muslos
  'M40 360 L100 400 L90 550 L55 550 Z',
  'M100 400 L160 360 L145 550 L110 550 Z',
  // Piernas
  'M55 550 L90 550 L85 700 L60 700 Z',
  'M110 550 L145 550 L140 700 L115 700 Z',
  // Pies
  'M60 700 L85 700 L95 750 L45 750 Z',
  'M115 700 L140 700 L155 750 L105 750 Z',
]

/**
 * SVG de la silueta como data-URL (utilizable como `src` de una imagen Konva).
 * Incluye marca de hombros con la cota en cm.
 */
export function humanFigureSvgDataUrl(shouldersCm: number): string {
  const body = PATHS.map(
    (d) => `<path d="${d}" fill="#94a3b8" fill-opacity="0.45" stroke="#475569" stroke-width="2"/>`,
  ).join('')
  const shoulderLine =
    `<line x1="0" y1="${SHOULDER_Y}" x2="${VIEW_W}" y2="${SHOULDER_Y}" stroke="#e11d48" stroke-width="2.5" stroke-dasharray="8 6"/>` +
    `<text x="4" y="${SHOULDER_Y - 6}" font-family="monospace" font-size="20" fill="#e11d48">${shouldersCm} cm</text>`

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW_W} ${VIEW_H}" width="${VIEW_W}" height="${VIEW_H}">` +
    body +
    shoulderLine +
    `</svg>`

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
