import type { Dispatch, SetStateAction } from 'react'
import { BoardObject, BoardBackground, PX_PER_CM } from '@shared/lib/boards/types'

type Vec = { x: number; y: number }

/**
 * Mutadores de objetos y selección (todos pasan por `mutate` → historial):
 * snap a la cuadrícula, mover/borrar, bloqueo, orden Z, parches de formato y
 * acciones del panel de capas. `setSquareCm` reescala los objetos al cambiar
 * la escala de cuadro para conservar su tamaño relativo.
 */
export function useObjectActions(
  objects: BoardObject[],
  selectedIds: string[],
  setSelectedIds: Dispatch<SetStateAction<string[]>>,
  background: BoardBackground,
  snap: boolean,
  stageSize: { w: number; h: number },
  pos: Vec,
  scale: number,
  mutate: (updater: (prev: BoardObject[]) => BoardObject[]) => void,
  setBackground: Dispatch<SetStateAction<BoardBackground>>,
) {
  /* ── Snap a cuadrícula ── */
  const gridGap = Math.max(8, background.squareCm * PX_PER_CM)
  const snapVal = (v: number) => Math.round(v / gridGap) * gridGap
  const applySnap = (o: BoardObject): BoardObject =>
    snap && background.type === 'grid' ? { ...o, x: snapVal(o.x), y: snapVal(o.y) } : o

  // Cambiar cm/cuadro: reescala alrededor del centro visible para conservar el
  // tamaño relativo a la cuadrícula (si no, al pasar de 50→2 la imagen explota).
  const setSquareCm = (raw: number) => {
    const next = Math.max(0.1, raw || 0.1)
    const prev = background.squareCm
    if (next !== prev) {
      const k = next / prev
      const cx = (stageSize.w / 2 - pos.x) / scale
      const cy = (stageSize.h / 2 - pos.y) / scale
      mutate((os) =>
        os.map((o) => ({
          ...o,
          x: cx + (o.x - cx) * k,
          y: cy + (o.y - cy) * k,
          w: o.w * k,
          h: o.h * k,
          fontSize: o.fontSize != null ? o.fontSize * k : o.fontSize,
          strokeWidth: o.strokeWidth != null ? o.strokeWidth * k : o.strokeWidth,
          points: o.points ? o.points.map((p) => p * k) : o.points,
        })),
      )
    }
    setBackground((b) => ({ ...b, squareCm: next }))
  }

  /* ── Mutadores de objetos ── */
  const updateObject = (o: BoardObject) => {
    const snapped = applySnap(o)
    mutate((arr) => arr.map((x) => (x.id === snapped.id ? snapped : x)))
  }

  /* ── Selección múltiple ── */
  const selectObject = (id: string, additive: boolean) => {
    setSelectedIds((prev) =>
      additive ? (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]) : [id]
    )
  }

  const deleteSelected = () => {
    if (!selectedIds.length) return
    const unlockedSel = objects.filter((o) => selectedIds.includes(o.id) && !o.locked).map((o) => o.id)
    if (!unlockedSel.length) return
    mutate((arr) => arr.filter((x) => !unlockedSel.includes(x.id)))
    setSelectedIds((prev) => prev.filter((id) => !unlockedSel.includes(id)))
  }

  const toggleLock = () => {
    if (!selectedIds.length) return
    const isAnyUnlocked = objects.some((o) => selectedIds.includes(o.id) && !o.locked)
    mutate((arr) => arr.map((o) => (selectedIds.includes(o.id) ? { ...o, locked: isAnyUnlocked } : o)))
  }

  const bringToFront = () => {
    if (!selectedIds.length) return
    mutate((arr) => {
      const maxZ = Math.max(0, ...arr.map((o) => o.z))
      let k = 1
      return arr.map((o) => (selectedIds.includes(o.id) ? { ...o, z: maxZ + k++ } : o))
    })
  }
  const sendToBack = () => {
    if (!selectedIds.length) return
    mutate((arr) => {
      const minZ = Math.min(0, ...arr.map((o) => o.z))
      let k = 1
      return arr.map((o) => (selectedIds.includes(o.id) ? { ...o, z: minZ - k++ } : o))
    })
  }

  // Aplica un parche a todos los seleccionados (panel de formato/estilo).
  const patchSelected = (patch: Partial<BoardObject>) => {
    if (!selectedIds.length) return
    mutate((arr) => arr.map((o) => (selectedIds.includes(o.id) ? { ...o, ...patch } : o)))
  }

  /* ── Capas (panel tipo Photoshop) ── */
  const patchObject = (id: string, patch: Partial<BoardObject>) =>
    mutate((arr) => arr.map((o) => (o.id === id ? { ...o, ...patch } : o)))
  const toggleLayerVisible = (id: string) => {
    const o = objects.find((x) => x.id === id)
    patchObject(id, { visible: o?.visible === false })
  }
  const toggleLayerLock = (id: string) =>
    patchObject(id, { locked: !objects.find((x) => x.id === id)?.locked })

  // Reordena por arrastre en el panel: recalcula z según el nuevo orden.
  const moveLayer = (dragId: string, targetId: string) => {
    if (dragId === targetId) return
    const asc = [...objects].sort((a, b) => a.z - b.z)
    const from = asc.findIndex((o) => o.id === dragId)
    const to = asc.findIndex((o) => o.id === targetId)
    if (from < 0 || to < 0) return
    const [moved] = asc.splice(from, 1)
    asc.splice(to, 0, moved)
    mutate((arr) => arr.map((o) => ({ ...o, z: asc.findIndex((x) => x.id === o.id) })))
  }

  return {
    snapVal,
    setSquareCm,
    updateObject,
    selectObject,
    deleteSelected,
    toggleLock,
    bringToFront,
    sendToBack,
    patchSelected,
    patchObject,
    toggleLayerVisible,
    toggleLayerLock,
    moveLayer,
  }
}
