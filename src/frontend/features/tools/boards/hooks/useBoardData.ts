import { useEffect, useRef, useState } from 'react'
import type { RefObject, Dispatch, SetStateAction } from 'react'
import type Konva from 'konva'
import { BoardData, BoardObject, BoardBackground, BoardWorkspace, PX_PER_CM } from '@shared/lib/boards/types'
import { pxOf } from '@shared/lib/measure'
import { takeHandoff } from '@shared/lib/tools/handoff'
import { uid } from '../lib/uid'

type Vec = { x: number; y: number }
type FitTarget = { x: number; y: number; w: number; h: number } | null

interface BoardStateBridge {
  objects: BoardObject[]
  background: BoardBackground
  name: string
  pos: Vec
  scale: number
  setObjects: Dispatch<SetStateAction<BoardObject[]>>
  setBackground: Dispatch<SetStateAction<BoardBackground>>
  setName: Dispatch<SetStateAction<string>>
  setPos: Dispatch<SetStateAction<Vec>>
  setScale: Dispatch<SetStateAction<number>>
  setFitTarget: Dispatch<SetStateAction<FitTarget>>
  setWorkspace: Dispatch<SetStateAction<BoardWorkspace>>
}

/**
 * Carga inicial del board (con handoff entrante) y autosave con debounce +
 * miniatura. Posee los estados de ciclo de vida (loaded/notFound/readOnly/
 * saveState). El encuadre real lo aplica el efecto de `fitTarget` del editor.
 */
export function useBoardData(
  boardId: string,
  stageRef: RefObject<Konva.Stage | null>,
  trRef: RefObject<Konva.Transformer | null>,
  s: BoardStateBridge,
) {
  const [loaded, setLoaded] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [readOnly, setReadOnly] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')

  /* ── Carga inicial ── */
  useEffect(() => {
    let active = true
    window.fetch(`/api/boards/${boardId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: { board: BoardData; isOwner: boolean }) => {
        if (!active) return
        let objs = d.board.objects ?? []
        let bg = d.board.background
        const vp = d.board.viewport
        let pendingFit: FitTarget = null

        // Handoff: imagen entrante de otra herramienta (?handoff=1).
        const params = new URLSearchParams(window.location.search)
        if (d.isOwner && params.get('handoff') === '1') {
          window.history.replaceState(null, '', `/dashboard/tools/boards/${boardId}`)
          const p = takeHandoff()
          if (p) {
            const w = pxOf(p.widthCm)
            const h = pxOf(p.heightCm)
            if (p.squareCm && bg)
              bg = {
                ...bg,
                squareCm: p.squareCm,
              }
            const target = p.objectId ? objs.find((o) => o.id === p.objectId) : null
            if (target) {
              objs = objs.map((o) => (o.id === p.objectId ? { ...o, src: p.imageUrl, w, h } : o))
              pendingFit = { x: target.x, y: target.y, w, h }
            } else {
              const z = (vp?.zoom || 1)
              const cx = -(vp?.x ?? 0) / z + 60
              const cy = -(vp?.y ?? 0) / z + 60
              const maxZ = Math.max(0, ...objs.map((o) => o.z))
              let newX = cx;
              let newY = cy;
              if (bg && bg.type === 'grid') {
                const gridGap = Math.max(8, bg.squareCm * PX_PER_CM);
                newX = Math.round(cx / gridGap) * gridGap;
                newY = Math.round(cy / gridGap) * gridGap;
              }
              objs = [...objs, { id: uid(), type: 'image', src: p.imageUrl, x: newX, y: newY, w, h, rotation: 0, z: maxZ + 1 }]
              pendingFit = { x: newX, y: newY, w, h }
            }
          }
        }

        s.setObjects(objs)
        if (bg) s.setBackground(bg)
        if (d.board.workspace) s.setWorkspace(d.board.workspace)
        s.setName(d.board.name)
        if (vp) {
          s.setPos({ x: vp.x, y: vp.y })
          s.setScale(vp.zoom || 1)
        }
        // Si llegó imagen por handoff, enmarcarla (el efecto de fit aplica
        // pos/scale cuando el escenario ya tiene tamaño) — anula el vp guardado.
        if (pendingFit) s.setFitTarget(pendingFit)
        setReadOnly(!d.isOwner)
        setLoaded(true)
      })
      .catch(() => active && setNotFound(true))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId])

  /* ── Autosave (debounce) ── */
  const firstSave = useRef(true)
  useEffect(() => {
    if (!loaded || readOnly) return
    if (firstSave.current) {
      firstSave.current = false
      return
    }
    setSaveState('saving')
    const t = setTimeout(() => {
      // Miniatura del lienzo (best-effort; falla en silencio si el canvas está
      // "tainted" por imágenes sin CORS).
      let thumbnailUrl: string | undefined
      try {
        const stage = stageRef.current
        const tr = trRef.current
        if (stage) {
          tr?.visible(false) // no capturar los manejadores de selección
          thumbnailUrl = stage.toDataURL({ pixelRatio: 0.25, mimeType: 'image/jpeg', quality: 0.6 })
          tr?.visible(true)
          tr?.getLayer()?.batchDraw()
        }
      } catch {
        thumbnailUrl = undefined
      }
      window.fetch(`/api/boards/${boardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objects: s.objects,
          background: s.background,
          name: s.name,
          viewport: { x: s.pos.x, y: s.pos.y, zoom: s.scale },
          ...(thumbnailUrl ? { thumbnailUrl } : {}),
        }),
      })
        .then(() => setSaveState('saved'))
        .catch(() => setSaveState('idle'))
    }, 800)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.objects, s.background, s.name, s.pos, s.scale, loaded, readOnly, boardId])

  return { loaded, notFound, readOnly, saveState }
}
