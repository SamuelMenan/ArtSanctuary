import type { BoardObject } from '@shared/lib/boards/types'

/** Props comunes a todos los nodos del lienzo (Konva). */
export interface BaseNodeProps {
  obj: BoardObject
  onSelect: (additive: boolean) => void
  onChange: (o: BoardObject) => void
  snap: boolean
  snapVal: (v: number) => number
  draggable: boolean
}
