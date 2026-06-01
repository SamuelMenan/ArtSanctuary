'use client'

/* eslint-disable react-hooks/refs --
   Las pilas de historial (undo/redo) y el portapapeles son refs que solo se
   leen/escriben dentro de event handlers, nunca durante el render. */

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cmOf, pxOf, applyScale } from '@shared/lib/measure'
import { setHandoff, takeHandoff } from '@shared/lib/tools/handoff'
import { Stage, Layer, Transformer } from 'react-konva'
import type Konva from 'konva'
import ImageSourceModal from '@frontend/features/tools/shared/ImageSourceModal'
import ImageNode from './nodes/ImageNode'
import TextNode from './nodes/TextNode'
import StickyNode from './nodes/StickyNode'
import ShapeNode from './nodes/ShapeNode'
import GridLayer from './layers/GridLayer'
import MeasureLayer from './layers/MeasureLayer'
import TextFormatBar from './toolbars/TextFormatBar'
import ShapeStyleBar from './toolbars/ShapeStyleBar'
import SelectionRect from './overlays/SelectionRect'
import MeasureLabel from './overlays/MeasureLabel'
import DimensionLabel from './overlays/DimensionLabel'
import TextEditor from './overlays/TextEditor'
import LayersPanel from './components/LayersPanel'
import DimensionsFooter from './toolbars/DimensionsFooter'
import TopBar from './toolbars/TopBar'
import ToolIsland from './toolbars/ToolIsland'
import InspectorIsland from './toolbars/InspectorIsland'
import ZoomIsland from './toolbars/ZoomIsland'
import { buildGridLines } from './lib/grid'
import {
  BoardData,
  BoardObject,
  BoardBackground,
  PX_PER_CM,
  DEFAULT_FONT,
} from '@shared/lib/boards/types'

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`

const SHAPE_TYPES = ['rect', 'ellipse', 'line', 'arrow'] as const
const isShape = (t: string) => (SHAPE_TYPES as readonly string[]).includes(t)

export default function BoardEditor({ boardId }: { boardId: string }) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const trRef = useRef<Konva.Transformer>(null)

  const [stageSize, setStageSize] = useState({ w: 0, h: 0 })
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)

  const [objects, setObjects] = useState<BoardObject[]>([])
  const [background, setBackground] = useState<BoardBackground>({
    type: 'grid',
    squareCm: 1.5,
    color: '#94a3b8',
    opacity: 35,
  })
  const [name, setName] = useState('Board sin título')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [snap, setSnap] = useState(true)
  const [layersOpen, setLayersOpen] = useState(false)
  const dragLayer = useRef<string | null>(null)
  const [tool, setTool] = useState<'select' | 'hand' | 'measure'>('select')
  const [spaceHeld, setSpaceHeld] = useState(false)
  const [selRect, setSelRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  // Medición (regla): puntos A→B en coordenadas de mundo.
  const [measure, setMeasure] = useState<{ ax: number; ay: number; bx: number; by: number } | null>(null)
  const measuring = useRef(false)
  const selStart = useRef<{ x: number; y: number; additive: boolean } | null>(null)
  const panning = useRef<{ x: number; y: number; px: number; py: number } | null>(null)
  const editTextRef = useRef<HTMLTextAreaElement>(null)

  // Historial (undo/redo) + portapapeles
  const past = useRef<BoardObject[][]>([])
  const future = useRef<BoardObject[][]>([])
  const clipboard = useRef<BoardObject[]>([])

  const [loaded, setLoaded] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [readOnly, setReadOnly] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [modalOpen, setModalOpen] = useState(false)
  // Encuadre pendiente: imagen entrante por handoff a enmarcar cuando el
  // escenario ya tenga tamaño (las imágenes físicas pueden ser enormes en px).
  const [fitTarget, setFitTarget] = useState<{ x: number; y: number; w: number; h: number } | null>(null)

  /* ── Tamaño del escenario ── */
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect
      setStageSize({ w: cr.width, h: cr.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /* ── Encuadre de imagen entrante (handoff) ──
     Las imágenes físicas pueden ser enormes (p. ej. 4 m = ~15 000 px); a zoom 1
     solo se ve una esquina. Ajusta zoom/posición para enmarcar la imagen con
     margen en cuanto el escenario tenga tamaño. */
  useEffect(() => {
    if (!fitTarget || stageSize.w === 0 || stageSize.h === 0) return
    const pad = 80
    const sx = (stageSize.w - pad * 2) / fitTarget.w
    const sy = (stageSize.h - pad * 2) / fitTarget.h
    const next = Math.min(5, Math.max(0.02, Math.min(sx, sy)))
    setScale(next)
    setPos({
      x: stageSize.w / 2 - (fitTarget.x + fitTarget.w / 2) * next,
      y: stageSize.h / 2 - (fitTarget.y + fitTarget.h / 2) * next,
    })
    setFitTarget(null)
  }, [fitTarget, stageSize])

  /* ── Carga inicial ── */
  useEffect(() => {
    let active = true
    fetch(`/api/boards/${boardId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: { board: BoardData; isOwner: boolean }) => {
        if (!active) return
        let objs = d.board.objects ?? []
        let bg = d.board.background
        const vp = d.board.viewport
        let pendingFit: { x: number; y: number; w: number; h: number } | null = null

        // Handoff: imagen entrante de otra herramienta (?handoff=1).
        const params = new URLSearchParams(window.location.search)
        if (d.isOwner && params.get('handoff') === '1') {
          window.history.replaceState(null, '', `/dashboard/boards/${boardId}`)
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

        setObjects(objs)
        if (bg) setBackground(bg)
        setName(d.board.name)
        if (vp) {
          setPos({ x: vp.x, y: vp.y })
          setScale(vp.zoom || 1)
        }
        // Si llegó imagen por handoff, enmarcarla (el efecto de fit aplica
        // pos/scale cuando el escenario ya tiene tamaño) — anula el vp guardado.
        if (pendingFit) setFitTarget(pendingFit)
        setReadOnly(!d.isOwner)
        setLoaded(true)
      })
      .catch(() => active && setNotFound(true))
    return () => {
      active = false
    }
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
      fetch(`/api/boards/${boardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objects,
          background,
          name,
          viewport: { x: pos.x, y: pos.y, zoom: scale },
          ...(thumbnailUrl ? { thumbnailUrl } : {}),
        }),
      })
        .then(() => setSaveState('saved'))
        .catch(() => setSaveState('idle'))
    }, 800)
    return () => clearTimeout(t)
  }, [objects, background, name, pos, scale, loaded, readOnly, boardId])

  /* ── Transformer sigue a la selección ── */
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
    // Only enable resizing if ALL selected nodes are unlocked
    tr.resizeEnabled(nodes.every(n => {
      const obj = objects.find(o => o.id === n.name())
      return !obj?.locked
    }))
    tr.getLayer()?.batchDraw()
  }, [selectedIds, editingId, objects])

  /* ── Espacio mantenido = modo paneo ── */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      e.preventDefault()
      setSpaceHeld(true)
    }
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpaceHeld(false)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  /* ── Foco al entrar en edición de texto ── */
  useEffect(() => {
    if (editingId && editTextRef.current) {
      const ta = editTextRef.current
      ta.focus()
      ta.select()
    }
  }, [editingId])

  /* ── Mutación con historial ── */
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

  /* ── Snap a cuadrícula ── */
  const gridGap = Math.max(8, background.squareCm * PX_PER_CM)
  const snapVal = (v: number) => Math.round(v / gridGap) * gridGap
  const applySnap = (o: BoardObject): BoardObject =>
    snap && background.type === 'grid' ? { ...o, x: snapVal(o.x), y: snapVal(o.y) } : o

  /* ── Medidas: 1 cuadro = squareCm cm. Conversión px(mundo) ↔ cm ── */
  const cmOf = (px: number) => px / PX_PER_CM
  const pxOf = (cm: number) => cm * PX_PER_CM
  // pantalla → mundo
  const toWorld = (sx: number, sy: number) => ({ x: (sx - pos.x) / scale, y: (sy - pos.y) / scale })

  /* ── Cambiar cm/cuadro: reescala los objetos para conservar su tamaño
     relativo a la cuadrícula. Sin esto, al pasar de 50→2 cm/cuadro el
     gridGap encoge 25× pero la imagen no, y queda gigante. El reescalado
     se hace alrededor del centro visible (no del origen) para que la zona
     que estás mirando se quede en su sitio. ── */
  const setSquareCm = (raw: number) => {
    const next = Math.max(0.1, raw || 0.1)
    const prev = background.squareCm
    if (next !== prev) {
      const k = next / prev
      // Pivote = centro del viewport en coordenadas de mundo.
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

  /* ── Copiar / pegar / duplicar ── */
  const copySelection = () => {
    const sel = objects.filter((o) => selectedIds.includes(o.id))
    if (sel.length) clipboard.current = sel.map((o) => ({ ...o }))
  }
  const placeClones = (src: BoardObject[]) => {
    if (!src.length) return
    const baseZ = Math.max(0, ...objects.map((o) => o.z)) + 1
    const clones = src.map((o, i) => ({ ...o, id: uid(), x: o.x + 24, y: o.y + 24, z: baseZ + i }))
    mutate((arr) => [...arr, ...clones])
    setSelectedIds(clones.map((c) => c.id))
  }
  const pasteClipboard = () => placeClones(clipboard.current)
  const duplicateSelection = () => placeClones(objects.filter((o) => selectedIds.includes(o.id)))

  /* ── Atajos de teclado ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (readOnly) return
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      const mod = e.ctrlKey || e.metaKey
      const k = e.key.toLowerCase()
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length) {
        e.preventDefault()
        deleteSelected()
      } else if (mod && k === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if (mod && k === 'y') {
        e.preventDefault()
        redo()
      } else if (mod && k === 'c') {
        e.preventDefault()
        copySelection()
      } else if (mod && k === 'v') {
        e.preventDefault()
        pasteClipboard()
      } else if (mod && k === 'd') {
        e.preventDefault()
        duplicateSelection()
      } else if (mod && k === 'a') {
        e.preventDefault()
        setSelectedIds(objects.map((o) => o.id))
      } else if (!mod && k === 'h') {
        setTool('hand')
        setMeasure(null)
      } else if (!mod && k === 'v') {
        setTool('select')
        setMeasure(null)
      } else if (!mod && k === 'm') {
        setTool('measure')
      } else if (e.key === 'Escape') {
        setMeasure(null)
        setSelectedIds([])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, readOnly, objects, snap, background])

  /* ── Centro de la vista en coords de mundo ── */
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

  /* ── Añadir imagen en el centro de la vista ── */
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

  // Selección simple (los paneles de formato solo aplican a un objeto).
  const selectedId = selectedIds.length === 1 ? selectedIds[0] : null
  // Enviar el objeto imagen seleccionado a otra herramienta (round-trip).
  const editIn = (tool: 'crop' | 'grid') => {
    const o = selectedId ? objects.find((x) => x.id === selectedId) : null
    if (!o || o.type !== 'image' || !o.src) return
    const widthCm = cmOf(o.w)
    const heightCm = cmOf(o.h)
    const widthScaledCm = applyScale(widthCm)
    const heightScaledCm = applyScale(heightCm)
    setHandoff({
      imageUrl: o.src,
      widthCm,
      heightCm,
      widthScaledCm,
      heightScaledCm,
      squareCm: background.squareCm,
      source: 'boards',
      boardId,
      objectId: o.id,
    })
    router.push(`/dashboard/tools/${tool}?handoff=1`)
  }

  const editingObj = editingId ? objects.find((o) => o.id === editingId) : null
  const selectedObj = selectedId ? objects.find((o) => o.id === selectedId) : null

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

  /* ── Pan + zoom ── */
  const onWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return
    const oldScale = scale
    const pointer = stage.getPointerPosition()
    if (!pointer) return
    const mousePoint = {
      x: (pointer.x - pos.x) / oldScale,
      y: (pointer.y - pos.y) / oldScale,
    }
    const next = Math.min(5, Math.max(0.02, oldScale * (e.evt.deltaY < 0 ? 1.08 : 1 / 1.08)))
    setScale(next)
    setPos({
      x: pointer.x - mousePoint.x * next,
      y: pointer.y - mousePoint.y * next,
    })
  }

  /* ── Selección por recuadro (rubber band) ── */
  const rectsIntersect = (
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; w: number; h: number }
  ) => !(a.x + a.width < b.x || a.x > b.x + b.w || a.y + a.height < b.y || a.y > b.y + b.h)

  const panMode = spaceHeld || tool === 'hand'

  const onStagePointerDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (readOnly) return
    const p = stageRef.current?.getPointerPosition()
    if (!p) return
    const isMiddle = 'button' in e.evt && e.evt.button === 1
    // Herramienta regla: traza A→B (no panea/selecciona salvo botón central).
    if (tool === 'measure' && !isMiddle && !spaceHeld) {
      const w = toWorld(p.x, p.y)
      measuring.current = true
      setMeasure({ ax: w.x, ay: w.y, bx: w.x, by: w.y })
      return
    }
    // Paneo: herramienta mano, espacio mantenido o botón central (sobre lo que sea).
    if (panMode || isMiddle) {
      e.evt.preventDefault?.()
      panning.current = { x: p.x, y: p.y, px: pos.x, py: pos.y }
      return
    }
    // Selección por recuadro: solo sobre lienzo vacío.
    if (e.target !== e.target.getStage()) return
    const additive = 'shiftKey' in e.evt ? e.evt.shiftKey : false
    selStart.current = { x: p.x, y: p.y, additive }
    if (!additive) setSelectedIds([])
    setSelRect({ x: p.x, y: p.y, w: 0, h: 0 })
  }

  const onStagePointerMove = () => {
    const p = stageRef.current?.getPointerPosition()
    if (!p) return
    if (measuring.current) {
      const w = toWorld(p.x, p.y)
      setMeasure((m) => (m ? { ...m, bx: w.x, by: w.y } : m))
      return
    }
    if (panning.current) {
      const pn = panning.current
      setPos({ x: pn.px + (p.x - pn.x), y: pn.py + (p.y - pn.y) })
      return
    }
    const s = selStart.current
    if (!s) return
    setSelRect({ x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y) })
  }

  const onStagePointerUp = () => {
    if (measuring.current) {
      measuring.current = false
      return
    }
    if (panning.current) {
      panning.current = null
      return
    }
    const s = selStart.current
    selStart.current = null
    const stage = stageRef.current
    const p = stage?.getPointerPosition()
    setSelRect(null)
    if (!s || !stage || !p) return
    const box = { x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y) }
    if (box.w < 3 && box.h < 3) return // fue un click, no un arrastre
    const ids: string[] = []
    for (const obj of objects) {
      const node = stage.findOne(`.${obj.id}`)
      if (node && rectsIntersect(node.getClientRect(), box)) ids.push(obj.id)
    }
    setSelectedIds((prev) => (s.additive ? Array.from(new Set([...prev, ...ids])) : ids))
  }

  const resetView = () => {
    setPos({ x: 0, y: 0 })
    setScale(1)
  }
  // Zoom centrado en el escenario (botones de la isla de vista).
  const zoomBy = (factor: number) => {
    const next = Math.min(5, Math.max(0.02, scale * factor))
    const cx = stageSize.w / 2
    const cy = stageSize.h / 2
    const wx = (cx - pos.x) / scale
    const wy = (cy - pos.y) / scale
    setScale(next)
    setPos({ x: cx - wx * next, y: cy - wy * next })
  }

  /* ── Exportar a PNG ── */
  const downloadBoard = () => {
    const stage = stageRef.current
    if (!stage) return
    const tr = trRef.current
    
    // Ocultar elementos de UI antes de capturar
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
      console.error("Export failed", e)
      alert("No se pudo exportar. Asegúrate de que todas las imágenes externas tienen permisos CORS.")
    }

    // Restaurar selección
    if (tr && selectedIds.length) {
      const nodes = selectedIds
        .map((id) => stage.findOne(`.${id}`))
        .filter((n): n is Konva.Node => !!n)
      tr.nodes(nodes)
      tr.getLayer()?.batchDraw()
    }
  }

  /* ── Líneas de grid visibles (mayor = squareCm, menor = squareCm/2) ── */
  // Color blanco (default viejo) → invisible en tema claro; cae a gris legible.
  const gridColor =
    !background.color || background.color.toLowerCase() === '#ffffff' ? '#94a3b8' : background.color

  const gridLines = useMemo(
    () =>
      buildGridLines({
        type: background.type,
        squareCm: background.squareCm,
        stageW: stageSize.w,
        stageH: stageSize.h,
        pos,
        scale,
      }),
    [background.type, background.squareCm, stageSize, pos, scale],
  )

  const sorted = useMemo(() => [...objects].sort((a, b) => a.z - b.z), [objects])

  if (notFound) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <span className="material-symbols-outlined text-5xl text-[var(--color-on-surface-variant)]/50">error</span>
        <p className="font-sans text-[var(--color-on-surface-variant)]">Board no encontrado o sin acceso.</p>
        <Link href="/dashboard/boards" className="font-mono text-[var(--text-label-sm)] uppercase tracking-widest text-[var(--color-primary)] hover:underline">
          ← Volver a boards
        </Link>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      {/* Barra superior (mínima): documento global */}
      <TopBar
        name={name}
        onName={setName}
        readOnly={readOnly}
        saveState={saveState}
        onUndo={undo}
        onRedo={redo}
        onDownload={downloadBoard}
      />

      {/* Panel de formato de texto (texto / nota seleccionados) */}
      {!readOnly && selectedObj && (selectedObj.type === 'text' || selectedObj.type === 'sticky') && (
        <TextFormatBar o={selectedObj} patch={patchSelected} />
      )}

      {/* Panel de estilo de figuras */}
      {!readOnly && selectedObj && isShape(selectedObj.type) && (
        <ShapeStyleBar o={selectedObj} patch={patchSelected} />
      )}

      {/* Escenario */}
      <div ref={containerRef} className={`flex-1 bg-[var(--color-surface-container-lowest)] min-h-0 overflow-hidden relative ${panMode ? 'cursor-grab active:cursor-grabbing' : tool === 'measure' ? 'cursor-crosshair' : ''}`}>
        {stageSize.w > 0 && (
          <Stage
            ref={stageRef}
            width={stageSize.w}
            height={stageSize.h}
            x={pos.x}
            y={pos.y}
            scaleX={scale}
            scaleY={scale}
            onWheel={onWheel}
            onMouseDown={onStagePointerDown}
            onTouchStart={onStagePointerDown}
            onMouseMove={onStagePointerMove}
            onTouchMove={onStagePointerMove}
            onMouseUp={onStagePointerUp}
            onTouchEnd={onStagePointerUp}
          >
            {/* Capa de fondo (grid milimetrado: menores 1cm + mayores 2cm) */}
            <GridLayer lines={gridLines} color={gridColor} scale={scale} opacity={background.opacity} />

            {/* Capa de objetos */}
            <Layer>
              {sorted.map((obj) => {
                const onSelect = (additive: boolean) => !readOnly && selectObject(obj.id, additive)
                const onEdit = () => !readOnly && !obj.locked && (setSelectedIds([obj.id]), setEditingId(obj.id))
                const draggable = tool === 'select' && !obj.locked && !readOnly
                if (obj.type === 'image')
                  return <ImageNode key={obj.id} obj={obj} isSelected={selectedIds.includes(obj.id)} onSelect={onSelect} onChange={updateObject} snap={snap} snapVal={snapVal} draggable={draggable} />
                if (obj.type === 'text')
                  return <TextNode key={obj.id} obj={obj} editing={obj.id === editingId} onSelect={onSelect} onEdit={onEdit} onChange={updateObject} snap={snap} snapVal={snapVal} draggable={draggable} />
                if (obj.type === 'sticky')
                  return <StickyNode key={obj.id} obj={obj} editing={obj.id === editingId} onSelect={onSelect} onEdit={onEdit} onChange={updateObject} snap={snap} snapVal={snapVal} draggable={draggable} />
                if (isShape(obj.type))
                  return <ShapeNode key={obj.id} obj={obj} onSelect={onSelect} onChange={updateObject} snap={snap} snapVal={snapVal} draggable={draggable} />
                return null
              })}
              {!readOnly && (
                <Transformer
                  ref={trRef}
                  rotateEnabled
                  keepRatio={false}
                  rotationSnapTolerance={4}
                  rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
                  ignoreStroke
                  boundBoxFunc={(oldBox, newBox) =>
                    // Rechaza solo si ambas dimensiones son diminutas (permite
                    // líneas/flechas finas, cuyo alto ≈ grosor).
                    Math.abs(newBox.width) < 5 && Math.abs(newBox.height) < 5 ? oldBox : newBox
                  }
                />
              )}
            </Layer>

            {/* Capa de medición (regla) */}
            {measure && <MeasureLayer measure={measure} scale={scale} />}
          </Stage>
        )}

        {/* Isla izquierda: herramientas + creación */}
        {!readOnly && (
          <ToolIsland
            tool={tool}
            onTool={(t) => { setTool(t); if (t !== 'measure') setMeasure(null) }}
            onAddImage={() => setModalOpen(true)}
            onAddText={addText}
            onAddSticky={addSticky}
            onAddShape={addShape}
          />
        )}

        {/* Isla derecha: inspector contextual + capas */}
        {!readOnly && (
          <InspectorIsland
            selectedIds={selectedIds}
            objects={objects}
            selectedObj={selectedObj}
            backgroundType={background.type}
            squareCm={background.squareCm}
            snap={snap}
            layersOpen={layersOpen}
            onToggleLock={toggleLock}
            onDuplicate={duplicateSelection}
            onBringToFront={bringToFront}
            onSendToBack={sendToBack}
            onEditIn={editIn}
            onDelete={deleteSelected}
            onToggleBackground={() => setBackground((b) => ({ ...b, type: b.type === 'grid' ? 'plain' : 'grid' }))}
            onToggleSnap={() => setSnap((s) => !s)}
            onSetSquareCm={setSquareCm}
            onToggleLayers={() => setLayersOpen((v) => !v)}
          />
        )}

        {/* Isla inferior izquierda: controles de vista */}
        <ZoomIsland scale={scale} onZoomIn={() => zoomBy(1.2)} onZoomOut={() => zoomBy(1 / 1.2)} onReset={resetView} />

        {/* Panel de capas (isla flotante) */}
        {!readOnly && layersOpen && (
          <LayersPanel
            objects={objects}
            selectedIds={selectedIds}
            selectedObj={selectedObj}
            dragRef={dragLayer}
            onSelect={(id) => setSelectedIds([id])}
            onClose={() => setLayersOpen(false)}
            onMove={moveLayer}
            onToggleVisible={toggleLayerVisible}
            onToggleLock={toggleLayerLock}
            onPatch={patchObject}
          />
        )}

        {/* Recuadro de selección (rubber band) */}
        {selRect && <SelectionRect rect={selRect} />}

        {/* Etiqueta de distancia de la regla */}
        {measure && <MeasureLabel measure={measure} pos={pos} scale={scale} isGrid={background.type === 'grid'} />}

        {/* Cota de tamaño real del objeto seleccionado */}
        {selectedObj && !editingId && (
          <DimensionLabel o={selectedObj} pos={pos} scale={scale} isGrid={background.type === 'grid'} />
        )}

        {loaded && objects.length === 0 && !readOnly && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none text-[var(--color-on-surface-variant)]">
            <span className="material-symbols-outlined text-5xl">add_photo_alternate</span>
            <span className="font-mono text-[var(--text-label-sm)] uppercase tracking-widest">Añade imagen, texto o nota para empezar</span>
          </div>
        )}

        {/* Edición de texto inline (textarea sobre el nodo) */}
        {editingObj && (
          <TextEditor o={editingObj} pos={pos} scale={scale} editRef={editTextRef} onChange={commitEditText} onFinish={finishEditing} />
        )}
      </div>

      {/* Footer: escala + dimensiones exactas del objeto seleccionado */}
      <DimensionsFooter
        squareCm={background.squareCm}
        objectCount={objects.length}
        selectedCount={selectedIds.length}
        selectedObj={selectedObj}
        readOnly={readOnly}
        onPatch={patchSelected}
      />

      {modalOpen && (
        <ImageSourceModal
          onClose={() => setModalOpen(false)}
          onSelect={(url) => {
            addImage(url)
            setModalOpen(false)
          }}
        />
      )}
    </div>
  )
}
