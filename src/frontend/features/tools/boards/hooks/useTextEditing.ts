import { useEffect } from 'react'
import type { RefObject, Dispatch, SetStateAction } from 'react'
import { BoardObject } from '@shared/lib/boards/types'

/**
 * Edición de texto inline: escritura en vivo (sin historial por pulsación) y
 * cierre que descarta los textos vacíos (las notas se conservan). Enfoca y
 * selecciona el textarea al entrar en edición.
 */
export function useTextEditing(
  editingId: string | null,
  objects: BoardObject[],
  editTextRef: RefObject<HTMLTextAreaElement | null>,
  setObjects: Dispatch<SetStateAction<BoardObject[]>>,
  setEditingId: Dispatch<SetStateAction<string | null>>,
  setSelectedIds: Dispatch<SetStateAction<string[]>>,
) {
  // Foco al entrar en edición.
  useEffect(() => {
    if (editingId && editTextRef.current) {
      const ta = editTextRef.current
      ta.focus()
      ta.select()
    }
  }, [editingId, editTextRef])

  // Texto en vivo: sin historial por pulsación (evita inundar undo).
  const commitEditText = (value: string) => {
    if (!editingId) return
    setObjects((arr) => arr.map((o) => (o.id === editingId ? { ...o, text: value } : o)))
  }
  // Cierra la edición; borra el texto si quedó vacío (las notas se conservan).
  const finishEditing = () => {
    const id = editingId
    setEditingId(null)
    if (!id) return
    const o = objects.find((x) => x.id === id)
    if (o && o.type === 'text' && !(o.text || '').trim()) {
      setObjects((arr) => arr.filter((x) => x.id !== id))
      setSelectedIds((sel) => sel.filter((s) => s !== id))
    }
  }

  return { commitEditText, finishEditing }
}
