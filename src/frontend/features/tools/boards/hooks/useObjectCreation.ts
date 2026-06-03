import type { Dispatch, SetStateAction } from 'react'
import { BoardObject, DEFAULT_FONT } from '@shared/lib/boards/types'
import { uid } from '../lib/uid'

type Vec = { x: number; y: number }

/**
 * Creación de objetos en el centro de la vista (imagen, texto, nota, figuras).
 * Cada objeto se añade vía `mutate`, queda seleccionado y, si procede, en edición.
 */
export function useObjectCreation(
  objects: BoardObject[],
  stageSize: { w: number; h: number },
  pos: Vec,
  scale: number,
  mutate: (updater: (prev: BoardObject[]) => BoardObject[]) => void,
  setSelectedIds: Dispatch<SetStateAction<string[]>>,
  setEditingId: Dispatch<SetStateAction<string | null>>,
) {
  const viewCenter = () => ({
    cx: (stageSize.w / 2 - pos.x) / scale,
    cy: (stageSize.h / 2 - pos.y) / scale,
  })
  const nextZ = () => Math.max(0, ...objects.map((o) => o.z)) + 1

  const addObject = (obj: BoardObject, edit = false) => {
    mutate((arr) => [...arr, obj])
    setSelectedIds([obj.id])
    if (edit) setEditingId(obj.id)
  }

  const addImage = (src: string) => {
    const image = new window.Image()
    image.crossOrigin = 'anonymous'
    image.src = src
    image.onload = () => {
      const maxDim = 400
      const ratio = Math.min(1, maxDim / Math.max(image.naturalWidth, image.naturalHeight))
      const w = image.naturalWidth * ratio
      const h = image.naturalHeight * ratio
      const { cx, cy } = viewCenter()
      addObject({ id: uid(), type: 'image', src, x: cx - w / 2, y: cy - h / 2, w, h, rotation: 0, z: nextZ() })
    }
  }

  const addText = () => {
    const { cx, cy } = viewCenter()
    const w = 220
    addObject({ id: uid(), type: 'text', text: '', x: cx - w / 2, y: cy - 20, w, h: 40, rotation: 0, z: nextZ(), fontSize: 24, fontFamily: DEFAULT_FONT, color: '#e8e8e8', align: 'left' }, true)
  }

  const addSticky = () => {
    const { cx, cy } = viewCenter()
    const w = 180
    const h = 180
    addObject({ id: uid(), type: 'sticky', text: '', x: cx - w / 2, y: cy - h / 2, w, h, rotation: 0, z: nextZ(), fontSize: 18, fontFamily: DEFAULT_FONT, color: '#FDE68A', textColor: '#1f2937', align: 'left' }, true)
  }

  const addShape = (type: BoardObject['type']) => {
    const { cx, cy } = viewCenter()
    const isLinear = type === 'line' || type === 'arrow'
    const w = isLinear ? 220 : 160
    const h = isLinear ? 0 : 120
    addObject({
      id: uid(),
      type,
      x: cx - w / 2,
      y: cy - h / 2,
      w,
      h,
      rotation: 0,
      z: nextZ(),
      ...(isLinear
        ? { stroke: '#e8e8e8', strokeWidth: 3 }
        : { fill: 'transparent', stroke: '#e8e8e8', strokeWidth: 2 }),
    })
  }

  /**
   * Añade un objeto ya construido por una extensión de workspace (p. ej. la
   * figura humana reglamentaria de Carnaval). El motor solo asigna id/z y lo
   * selecciona; la extensión decide tipo, posición y tamaño. Mantiene a `boards`
   * agnóstico de cualquier tipo concreto.
   */
  const addExtensionObject = (obj: Omit<BoardObject, 'id' | 'z'>) =>
    addObject({ ...obj, id: uid(), z: nextZ() })

  return { addImage, addText, addSticky, addShape, addExtensionObject }
}
