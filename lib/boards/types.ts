// Tipos compartidos del board en cliente. No importar el modelo Mongoose aquí
// (arrastraría mongoose al bundle del navegador).

export type BoardObjectType =
  | 'image'
  | 'text'
  | 'sticky'
  | 'rect'
  | 'ellipse'
  | 'line'
  | 'arrow'

export type BoardObject = {
  id: string
  type: BoardObjectType
  x: number
  y: number
  w: number
  h: number
  rotation: number
  z: number
  // específicos
  src?: string
  text?: string
  fontSize?: number
  fontFamily?: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  color?: string // text: fill · sticky: fondo
  textColor?: string // sticky: color del texto
  align?: 'left' | 'center' | 'right'
  fill?: string
  stroke?: string
  strokeWidth?: number
  points?: number[]
}

/** Fuentes disponibles (web-safe del sistema: Konva las pinta en canvas). */
export const BOARD_FONTS = [
  { label: 'Sans', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Serif', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Mono', value: '"Courier New", monospace' },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Trebuchet', value: '"Trebuchet MS", sans-serif' },
  { label: 'Times', value: '"Times New Roman", Times, serif' },
  { label: 'Impact', value: 'Impact, Charcoal, sans-serif' },
  { label: 'Comic', value: '"Comic Sans MS", cursive' },
] as const

export const DEFAULT_FONT = BOARD_FONTS[0].value

/** Construye el `fontStyle` de Konva a partir de bold/italic. */
export function konvaFontStyle(o: { bold?: boolean; italic?: boolean }): string {
  const parts = []
  if (o.italic) parts.push('italic')
  if (o.bold) parts.push('bold')
  return parts.join(' ') || 'normal'
}

export type BoardBackground = {
  type: 'grid' | 'dots' | 'plain'
  squareCm: number
  color: string
  opacity: number
}

export type BoardViewport = { x: number; y: number; zoom: number }

export type BoardData = {
  _id: string
  name: string
  isPrivate: boolean
  background: BoardBackground
  objects: BoardObject[]
  viewport: BoardViewport
}

// 96 dpi: 1 cm ≈ 37.795 px (mundo). Fuente única en lib/measure.
export { PX_PER_CM } from '@/lib/measure'
