import { useCallback, useEffect, useRef } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { BoardObject } from '@shared/lib/boards/types'

/**
 * Historial undo/redo del lienzo. `mutate` apila el estado previo antes de
 * aplicar el cambio; undo/redo restauran y limpian la selección/edición.
 * Las pilas son refs (solo se leen/escriben en handlers, nunca en render).
 *
 * `mutate`/`undo`/`redo` tienen identidad ESTABLE (useCallback): leen el estado
 * vivo por ref, no por closure. Así los nodos memoizados que reciben estos
 * callbacks no se re-renderizan cuando `objects` cambia.
 */
export function useHistory(
  objects: BoardObject[],
  setObjects: Dispatch<SetStateAction<BoardObject[]>>,
  setSelectedIds: Dispatch<SetStateAction<string[]>>,
  setEditingId: Dispatch<SetStateAction<string | null>>,
) {
  const past = useRef<BoardObject[][]>([])
  const future = useRef<BoardObject[][]>([])
  // Estado vivo por ref: el snapshot pre-mutación se lee aquí (no por closure),
  // lo que permite que los callbacks tengan identidad estable. Se sincroniza tras
  // el commit; los handlers (eventos de usuario) corren después del paint → ven
  // siempre el valor actual.
  const objectsRef = useRef(objects)
  useEffect(() => {
    objectsRef.current = objects
  }, [objects])

  // Snapshot del estado actual antes de mutar (ref = pre-estado correcto).
  const mutate = useCallback(
    (updater: (prev: BoardObject[]) => BoardObject[]) => {
      past.current.push(objectsRef.current)
      if (past.current.length > 60) past.current.shift()
      future.current = []
      setObjects(updater)
    },
    [setObjects],
  )

  const undo = useCallback(() => {
    if (!past.current.length) return
    const prev = past.current.pop() as BoardObject[]
    future.current.push(objectsRef.current)
    setObjects(prev)
    setSelectedIds([])
    setEditingId(null)
  }, [setObjects, setSelectedIds, setEditingId])

  const redo = useCallback(() => {
    if (!future.current.length) return
    const nxt = future.current.pop() as BoardObject[]
    past.current.push(objectsRef.current)
    setObjects(nxt)
    setSelectedIds([])
  }, [setObjects, setSelectedIds])

  return { mutate, undo, redo }
}
