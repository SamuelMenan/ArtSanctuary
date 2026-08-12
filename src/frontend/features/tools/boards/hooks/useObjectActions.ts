import { useCallback } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { BoardObject, BoardBackground, PX_PER_CM } from '@shared/lib/boards/types'
import { uid } from '../lib/uid'

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
  /* ── Snap a cuadrícula ──
     snapVal/snapDrag tienen identidad ESTABLE (useCallback dep squareCm): solo
     cambian al cambiar la escala de cuadro, no en cada pan/zoom. Así los nodos
     memoizados que los reciben no se re-renderizan al panear. */
  // Usar siempre majorGap para el imán garantiza que las imágenes cuadriculadas
  // siempre coincidan perfectamente con el fondo mayor (evita desfasarse medio cuadro).
  const gridGap = Math.max(8, background.squareCm * PX_PER_CM)
  const snapVal = useCallback((v: number) => Math.round(v / gridGap) * gridGap, [gridGap])
  // Banda del imán: fracción de la celda dentro de la cual el borde se pega a la
  // línea. Fuera de la banda (centro de la celda) la colocación es LIBRE → se
  // puede soltar en el punto exacto, no salta siempre a la cuadrícula. ~0.22 deja
  // ~56% de la celda libre y un 22% magnético junto a cada línea (estilo Figma).
  const SNAP_BAND = 0.22
  const snapDrag = useCallback(
    (v: number, span: number) => {
      const dLeft = snapVal(v) - v
      const dRight = snapVal(v + span) - (v + span)
      // Imanta por el borde cuyo desplazamiento a la línea sea menor.
      const d = Math.abs(dLeft) <= Math.abs(dRight) ? dLeft : dRight
      // Solo se pega si ese borde está dentro de la banda; si no, queda libre.
      return Math.abs(d) <= gridGap * SNAP_BAND ? v + d : v
    },
    [snapVal, gridGap],
  )
  const bgType = background.type
  const applySnap = useCallback(
    (o: BoardObject): BoardObject =>
      snap && bgType === 'grid' ? { ...o, x: snapDrag(o.x, o.w || 0), y: snapDrag(o.y, o.h || 0) } : o,
    [snap, bgType, snapDrag],
  )

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

  /* ── Mutadores de objetos ── (identidad estable: no re-renderiza nodos memo) */
  const updateObject = useCallback(
    (o: BoardObject) => {
      const snapped = applySnap(o)
      mutate((arr) => arr.map((x) => (x.id === snapped.id ? snapped : x)))
    },
    [applySnap, mutate],
  )

  /* ── Selección múltiple ── */
  const selectObject = useCallback(
    (id: string, additive: boolean) => {
      setSelectedIds((prev) =>
        additive ? (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]) : [id],
      )
    },
    [setSelectedIds],
  )

  // Mueve la selección por teclado (flechas). Precisión exacta: ignora snap.
  const nudgeSelected = (dx: number, dy: number) => {
    if (!selectedIds.length) return
    mutate((arr) =>
      arr.map((o) => (selectedIds.includes(o.id) && !o.locked ? { ...o, x: o.x + dx, y: o.y + dy } : o)),
    )
  }

  // Duplica un objeto en su misma posición (Alt+arrastrar): la copia queda
  // debajo del original mientras éste se arrastra.
  const cloneInPlace = (id: string) => {
    const src = objects.find((o) => o.id === id)
    if (!src || src.locked) return
    mutate((arr) => {
      const maxZ = Math.max(0, ...arr.map((o) => o.z))
      return [...arr, { ...src, id: uid(), z: maxZ + 1 }]
    })
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
  const patchSelected = (patch: Partial<BoardObject> | ((o: BoardObject) => Partial<BoardObject>)) => {
    if (!selectedIds.length) return
    mutate((arr) =>
      arr.map((o) => {
        if (!selectedIds.includes(o.id) || o.locked) return o
        const p = typeof patch === 'function' ? patch(o) : patch
        return { ...o, ...p }
      }),
    )
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
    snapDrag,
    gridGap,
    setSquareCm,
    updateObject,
    selectObject,
    nudgeSelected,
    cloneInPlace,
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
