// Shared client-side board types. Do not import the Mongoose model here
// (it would pull mongoose into the browser bundle).

export type BoardObjectType =
  | 'image'
  | 'text'
  | 'sticky'
  | 'rect'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'freehand'

export type BoardObject = {
  id: string
  type: BoardObjectType
  x: number
  y: number
  w: number
  h: number
  rotation: number
  z: number
  // layer props
  name?: string // editable layer name
  visible?: boolean // default true; false hides + makes unselectable
  opacity?: number // 0–100, default 100
  locked?: boolean // blocks move/resize (still selectable to unlock)
  blendMode?: string // (future) Konva globalCompositeOperation
  // type-specific
  src?: string
  /** Imagen: volteo horizontal sin alterar caja/medidas. */
  flipX?: boolean
  text?: string
  fontSize?: number
  fontFamily?: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  color?: string // text: fill · sticky: background
  textColor?: string // sticky: text color
  align?: 'left' | 'center' | 'right'
  fill?: string
  stroke?: string
  strokeWidth?: number
  points?: number[]
  /** Imagen: tamaño de celda (cm) de la cuadrícula superpuesta (método de
   *  cuadrícula para ampliar). `undefined`/0 = sin cuadrícula. */
  gridCm?: number
}

/** Available fonts (web-safe system fonts: Konva renders them on canvas). */
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

/** Builds Konva's `fontStyle` from bold/italic. */
export function konvaFontStyle(o: { bold?: boolean; italic?: boolean }): string {
  const parts = []
  if (o.italic) parts.push('italic')
  if (o.bold) parts.push('bold')
  return parts.join(' ') || 'normal'
}

export type BoardBackground = {
  type: 'grid' | 'dots' | 'plain'
  squareCm: number // escala activa de la cuadrícula (cm por cuadro)
  color: string
  opacity: number
}

export type BoardViewport = { x: number; y: number; zoom: number }

// ── Workspace (Fase 2 — Carnaval) ──
// 'free' = Board Libre (escala global 215/14). 'carnaval' = modalidad
// Corpocarnaval con su escala, reglas y zonas reglamentarias.
// NOTA: solo imports de TIPO desde carnaval (se borran al compilar). El motor
// `boards` no tiene dependencia de runtime con ningún tipo de workspace; la
// resolución de escala vive en `@shared/lib/workspaces/registry` (workspaceScaler).
import type { CarnavalModality, CarnavalPlano } from '@shared/lib/workspaces/carnaval'

export type BoardWorkspaceKind = 'free' | 'carnaval'
export type BoardWorkspace = {
  kind: BoardWorkspaceKind
  modality?: CarnavalModality
  /** Plano que representa este board dentro de un proyecto (Fase 3/5). */
  view?: CarnavalPlano
}

export const DEFAULT_WORKSPACE: BoardWorkspace = { kind: 'free' }

export type BoardData = {
  _id: string
  name: string
  isPrivate: boolean
  /** Espejado automático entre lateral izq/der en proyectos Carnaval. */
  lateralMirrorEnabled?: boolean
  background: BoardBackground
  objects: BoardObject[]
  viewport: BoardViewport
  workspace?: BoardWorkspace
  /** Proyecto Carnaval al que pertenece este plano, si aplica (Fase 3). */
  projectId?: string
}

// 96 dpi: 1 cm ≈ 37.795 px (world). Single source in lib/measure.
export { PX_PER_CM } from '@shared/lib/measure'
