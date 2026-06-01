import { useRef } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { BoardObject } from '@shared/lib/boards/types'

/**
 * Historial undo/redo del lienzo. `mutate` apila el estado previo antes de
 * aplicar el cambio; undo/redo restauran y limpian la selección/edición.
 * Las pilas son refs (solo se leen/escriben en handlers, nunca en render).
 */
export function useHistory(
  objects: BoardObject[],
  setObjects: Dispatch<SetStateAction<BoardObject[]>>,
  setSelectedIds: Dispatch<SetStateAction<string[]>>,
  setEditingId: Dispatch<SetStateAction<string | null>>,
) {
  const past = useRef<BoardObject[][]>([])
  const future = useRef<BoardObject[][]>([])

  // Snapshot del estado actual antes de mutar (closure = pre-estado correcto).
  const mutate = (updater: (prev: BoardObject[]) => BoardObject[]) => {
    past.current.push(objects)
    if (past.current.length > 60) past.current.shift()
    future.current = []
    setObjects(updater)
  }

  const undo = () => {
    if (!past.current.length) return
    const prev = past.current.pop() as BoardObject[]
    future.current.push(objects)
    setObjects(prev)
    setSelectedIds([])
    setEditingId(null)
  }
  const redo = () => {
    if (!future.current.length) return
    const nxt = future.current.pop() as BoardObject[]
    past.current.push(objects)
    setObjects(nxt)
    setSelectedIds([])
  }

  return { mutate, undo, redo }
}
