import type { RefObject } from 'react'
import { useRouter } from 'next/navigation'
import type Konva from 'konva'
import { BoardObject } from '@shared/lib/boards/types'
import { cmOf, applyScale } from '@shared/lib/measure'
import { setHandoff } from '@shared/lib/tools/handoff'

interface BoardExportArgs {
  boardId: string
  name: string
  objects: BoardObject[]
  selectedId: string | null
  selectedIds: string[]
  squareCm: number
  stageRef: RefObject<Konva.Stage | null>
  trRef: RefObject<Konva.Transformer | null>
}

/**
 * Salidas del board: exportar a PNG (oculta el Transformer durante la captura)
 * y enviar la imagen seleccionada a otra herramienta (Recorte/Cuadrícula) con
 * sus medidas Referencia + Final, conservando el round-trip.
 */
export function useBoardExport({
  boardId,
  name,
  objects,
  selectedId,
  selectedIds,
  squareCm,
  stageRef,
  trRef,
}: BoardExportArgs) {
  const router = useRouter()

  // Enviar el objeto imagen seleccionado a otra herramienta (round-trip).
  const editIn = (tool: 'crop' | 'grid') => {
    const o = selectedId ? objects.find((x) => x.id === selectedId) : null
    if (!o || o.type !== 'image' || !o.src) return
    const widthCm = cmOf(o.w)
    const heightCm = cmOf(o.h)
    setHandoff({
      imageUrl: o.src,
      widthCm,
      heightCm,
      widthScaledCm: applyScale(widthCm),
      heightScaledCm: applyScale(heightCm),
      squareCm,
      source: 'boards',
      boardId,
      objectId: o.id,
    })
    router.push(`/dashboard/tools/${tool}?handoff=1`)
  }

  const downloadBoard = () => {
    const stage = stageRef.current
    if (!stage) return
    const tr = trRef.current

    // Ocultar elementos de UI antes de capturar.
    if (tr) {
      tr.nodes([])
      tr.getLayer()?.batchDraw()
    }

    try {
      const dataURL = stage.toDataURL({ pixelRatio: 2, mimeType: 'image/png' })
      const a = document.createElement('a')
      a.href = dataURL
      a.download = `${name.trim() || 'board'}.png`
      a.click()
    } catch (e) {
      console.error('Export failed', e)
      alert('No se pudo exportar. Asegúrate de que todas las imágenes externas tienen permisos CORS.')
    }

    // Restaurar selección.
    if (tr && selectedIds.length) {
      const nodes = selectedIds
        .map((id) => stage.findOne(`.${id}`))
        .filter((n): n is Konva.Node => !!n)
      tr.nodes(nodes)
      tr.getLayer()?.batchDraw()
    }
  }

  return { editIn, downloadBoard }
}
