// Import relativo (no alias) para que el test de Vitest resuelva sin config.
import { PX_PER_CM } from '../../../../../shared/lib/measure'

export interface GridLine {
  points: number[]
  key: string
}

export interface GridLines {
  minor: GridLine[]
  major: GridLine[]
}

export interface GridParams {
  /** Tipo de fondo; sólo se dibujan líneas cuando es 'grid'. */
  type: string
  /** Centímetros por cuadro mayor. */
  squareCm: number
  /** Tamaño del escenario en px de pantalla. */
  stageW: number
  stageH: number
  /** Desplazamiento del viewport (px de pantalla). */
  pos: { x: number; y: number }
  /** Zoom. */
  scale: number
}

/**
 * Calcula las líneas de cuadrícula (mayor y menor) en coordenadas de mundo,
 * acotadas al viewport visible. Las menores se ocultan cuando quedan demasiado
 * juntas en pantalla (< 6 px) o si el fondo no es de tipo cuadrícula.
 */
export function buildGridLines({ type, squareCm, stageW, stageH, pos, scale }: GridParams): GridLines {
  if (type !== 'grid' || stageW === 0) return { minor: [], major: [] }
  const major = Math.max(8, squareCm * PX_PER_CM)
  const minor = major / 2
  const left = -pos.x / scale
  const top = -pos.y / scale
  const right = (stageW - pos.x) / scale
  const bottom = (stageH - pos.y) / scale
  const build = (gap: number): GridLine[] => {
    const out: GridLine[] = []
    const sx = Math.floor(left / gap) * gap
    const sy = Math.floor(top / gap) * gap
    for (let x = sx; x <= right; x += gap) out.push({ points: [x, top, x, bottom], key: `v${x}` })
    for (let y = sy; y <= bottom; y += gap) out.push({ points: [left, y, right, y], key: `h${y}` })
    return out
  }
  // Oculta las menores cuando quedan demasiado juntas en pantalla.
  return { minor: minor * scale > 6 ? build(minor) : [], major: build(major) }
}
