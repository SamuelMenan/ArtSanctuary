import type { BoardObject } from '@shared/lib/boards/types'

/** Props comunes a todos los nodos del lienzo (Konva).
 *
 *  Los callbacks reciben el `id` (no closure por objeto) para que el padre pueda
 *  pasar handlers de identidad ESTABLE → los nodos memoizados solo se
 *  re-renderizan cuando cambian SUS props, no en cada pan/zoom/selección. */
export interface BaseNodeProps {
  obj: BoardObject
  /** Selecciona el objeto (additive = shift). El nodo aporta su id. */
  onSelect: (id: string, additive: boolean) => void
  onChange: (o: BoardObject) => void
  /** Solo lectura: desactiva selección/edición/arrastre (guard dentro del nodo). */
  readOnly?: boolean
  snap: boolean
  snapVal: (v: number) => number
  snapDrag: (v: number, span: number) => number
  draggable: boolean
  /** Zoom del escenario (para grosores de línea constantes; lo usa la cuadrícula de imagen). */
  scale?: number
}
