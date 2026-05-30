// Transferencia de imágenes entre herramientas (Boards ↔ Cuadrícula ↔ Recorte)
// conservando el tamaño físico. Las imágenes son URLs persistentes (/api/upload),
// así que basta sessionStorage + un flag en la URL (?handoff=1).

export type ToolSource = 'cuadricula' | 'recorte' | 'boards' | 'upload'

export interface PhysicalImage {
  imageUrl: string // URL persistente (Blob o /storage)
  widthCm: number
  heightCm: number
  squareCm?: number // cuadro sugerido (de cuadrícula/board)
  source: ToolSource
  // round-trip a Boards:
  boardId?: string
  objectId?: string // objeto a reemplazar al volver
}

const KEY = 'tool-handoff'

export function setHandoff(p: PhysicalImage): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    /* sessionStorage no disponible */
  }
}

/** Lee y consume (borra) el handoff pendiente. */
export function takeHandoff(): PhysicalImage | null {
  try {
    const s = sessionStorage.getItem(KEY)
    if (!s) return null
    sessionStorage.removeItem(KEY)
    return JSON.parse(s) as PhysicalImage
  } catch {
    return null
  }
}
