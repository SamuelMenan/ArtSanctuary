// Image transfer between tools (Boards ↔ Grid ↔ Crop) preserving the physical
// size. Images are persistent URLs (/api/upload), so sessionStorage + a URL
// flag (?handoff=1) is enough.

export type ToolSource = 'grid' | 'crop' | 'boards' | 'upload'

export interface PhysicalImage {
  imageUrl: string // persistent URL (Blob or /storage)
  widthCm: number
  heightCm: number
  // Medidas escaladas (Final) según la escala global
  widthScaledCm?: number
  heightScaledCm?: number
  squareCm?: number // suggested grid square (from grid/board) = FINAL square
  source: ToolSource
  // round-trip back to Boards:
  boardId?: string
  objectId?: string // object to replace on return
}

const KEY = 'tool-handoff'

export function setHandoff(p: PhysicalImage): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    /* sessionStorage unavailable */
  }
}

/** Read and consume (clear) the pending handoff. */
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
export function peekHandoff(): PhysicalImage | null {
  try {
    const s = sessionStorage.getItem(KEY)
    if (!s) return null
    return JSON.parse(s) as PhysicalImage
  } catch {
    return null
  }
}
