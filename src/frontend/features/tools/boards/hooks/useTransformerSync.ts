import { useEffect } from 'react'
import type { RefObject } from 'react'
import type Konva from 'konva'
import { BoardObject } from '@shared/lib/boards/types'

/**
 * Mantiene el Transformer de Konva enganchado a la selección actual: oculta sus
 * manejadores durante la edición de texto y desactiva el redimensionado cuando
 * algún objeto seleccionado está bloqueado o no es visible.
 */
export function useTransformerSync(
  trRef: RefObject<Konva.Transformer | null>,
  stageRef: RefObject<Konva.Stage | null>,
  selectedIds: string[],
  editingId: string | null,
  objects: BoardObject[],
) {
  useEffect(() => {
    const tr = trRef.current
    const stage = stageRef.current
    if (!tr || !stage) return
    if (!selectedIds.length || editingId) {
      tr.nodes([])
      tr.getLayer()?.batchDraw()
      return
    }
    const nodes = selectedIds
      .map((id) => stage.findOne(`.${id}`))
      .filter((n): n is Konva.Node => !!n && objects.find((o) => o.id === n.name())?.visible !== false)
    tr.nodes(nodes)
    // Solo permitir redimensionar si TODOS los nodos seleccionados están desbloqueados.
    tr.resizeEnabled(nodes.every((n) => {
      const obj = objects.find((o) => o.id === n.name())
      return !obj?.locked
    }))
    tr.getLayer()?.batchDraw()
  }, [trRef, stageRef, selectedIds, editingId, objects])
}
