import { useRef } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { BoardObject } from '@shared/lib/boards/types'
import { uid } from '../lib/uid'

/**
 * Portapapeles del lienzo: copiar/pegar/duplicar. Los clones se colocan con un
 * desfase de 24 px sobre el tope de z y quedan seleccionados.
 */
export function useClipboard(
  objects: BoardObject[],
  selectedIds: string[],
  setSelectedIds: Dispatch<SetStateAction<string[]>>,
  mutate: (updater: (prev: BoardObject[]) => BoardObject[]) => void,
) {
  const clipboard = useRef<BoardObject[]>([])

  const copySelection = () => {
    const sel = objects.filter((o) => selectedIds.includes(o.id))
    if (sel.length) clipboard.current = sel.map((o) => ({ ...o }))
  }
  const placeClones = (src: BoardObject[]) => {
    if (!src.length) return
    const baseZ = Math.max(0, ...objects.map((o) => o.z)) + 1
    const clones = src.map((o, i) => ({ ...o, id: uid(), x: o.x + 24, y: o.y + 24, z: baseZ + i }))

    // Actualizar objetos y selección con los nuevos clones
    mutate((arr) => [...arr, ...clones])
    setSelectedIds(clones.map((c) => c.id))
  }
  const pasteClipboard = () => placeClones(clipboard.current)
  const duplicateSelection = () => placeClones(objects.filter((o) => selectedIds.includes(o.id)))

  return { copySelection, pasteClipboard, duplicateSelection }
}

