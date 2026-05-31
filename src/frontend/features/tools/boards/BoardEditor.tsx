'use client'

/* eslint-disable react-hooks/refs --
   Las pilas de historial (undo/redo) y el portapapeles son refs que solo se
   leen/escriben dentro de event handlers, nunca durante el render. */

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cmOf, pxOf } from '@shared/lib/measure'
import { setHandoff, takeHandoff } from '@shared/lib/tools/handoff'
import { Stage, Layer, Line, Image as KonvaImage, Text as KonvaText, Rect, Ellipse, Arrow, Group, Transformer } from 'react-konva'
import type Konva from 'konva'
import ImageSourceModal from '@frontend/features/tools/shared/ImageSourceModal'
import {
  BoardData,
  BoardObject,
  BoardBackground,
  PX_PER_CM,
  BOARD_FONTS,
  DEFAULT_FONT,
  konvaFontStyle,
} from '@shared/lib/boards/types'

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`

/* ── Nodo imagen: gestiona su propio HTMLImageElement ── */
function URLImage({
  obj,
  isSelected,
  onSelect,
  onChange,
  snap,
  snapVal,
  draggable,
}: {
  obj: BoardObject
  isSelected: boolean
  onSelect: (additive: boolean) => void
  onChange: (o: BoardObject) => void
  snap: boolean
  snapVal: (v: number) => number
  draggable: boolean
}) {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const ref = useRef<Konva.Image>(null)

  useEffect(() => {
    if (!obj.src) return
    const image = new window.Image()
    image.crossOrigin = 'anonymous'
    image.src = obj.src
    image.onload = () => setImg(image)
  }, [obj.src])

  return (
    <KonvaImage
      ref={ref}
      name={obj.id}
      image={img ?? undefined}
      x={obj.x}
      y={obj.y}
      width={obj.w}
      height={obj.h}
      rotation={obj.rotation}
      opacity={(obj.opacity ?? 100) / 100}
      visible={obj.visible !== false}
      draggable={draggable}
      onClick={(e) => onSelect(e.evt.shiftKey)}
      onTap={(e) => onSelect(e.evt.shiftKey)}
      onDragMove={(e) => {
        if (snap) {
          e.target.x(snapVal(e.target.x()))
          e.target.y(snapVal(e.target.y()))
        }
      }}
      onDragEnd={(e) => onChange({ ...obj, x: e.target.x(), y: e.target.y() })}
      onTransformEnd={() => {
        const node = ref.current
        if (!node) return
        const scaleX = node.scaleX()
        const scaleY = node.scaleY()
        node.scaleX(1)
        node.scaleY(1)
        onChange({
          ...obj,
          x: node.x(),
          y: node.y(),
          w: Math.max(20, node.width() * scaleX),
          h: Math.max(20, node.height() * scaleY),
          rotation: node.rotation(),
        })
      }}
      shadowColor={isSelected ? '#000' : undefined}
      shadowBlur={isSelected ? 8 : 0}
      shadowOpacity={0.3}
    />
  )
}

/* ── Nodo texto libre ── */
function BoardText({
  obj,
  editing,
  onSelect,
  onEdit,
  onChange,
  snap,
  snapVal,
  draggable,
}: {
  obj: BoardObject
  editing: boolean
  onSelect: (additive: boolean) => void
  onEdit: () => void
  onChange: (o: BoardObject) => void
  snap: boolean
  snapVal: (v: number) => number
  draggable: boolean
}) {
  const ref = useRef<Konva.Text>(null)
  return (
    <KonvaText
      ref={ref}
      name={obj.id}
      text={obj.text || ' '}
      x={obj.x}
      y={obj.y}
      width={obj.w}
      rotation={obj.rotation}
      opacity={(obj.opacity ?? 100) / 100}
      visible={obj.visible !== false && !editing}
      fontSize={obj.fontSize || 24}
      fontFamily={obj.fontFamily || DEFAULT_FONT}
      fontStyle={konvaFontStyle(obj)}
      textDecoration={obj.underline ? 'underline' : ''}
      fill={obj.color || '#e8e8e8'}
      align={obj.align || 'left'}
      draggable={draggable}
      onClick={(e) => onSelect(e.evt.shiftKey)}
      onTap={(e) => onSelect(e.evt.shiftKey)}
      onDblClick={onEdit}
      onDblTap={onEdit}
      onDragMove={(e) => {
        if (snap) {
          e.target.x(snapVal(e.target.x()))
          e.target.y(snapVal(e.target.y()))
        }
      }}
      onDragEnd={(e) => onChange({ ...obj, x: e.target.x(), y: e.target.y() })}
      onTransformEnd={() => {
        const node = ref.current
        if (!node) return
        const scaleX = node.scaleX()
        node.scaleX(1)
        node.scaleY(1)
        onChange({ ...obj, x: node.x(), y: node.y(), w: Math.max(30, node.width() * scaleX), rotation: node.rotation() })
      }}
    />
  )
}

/* ── Nota adhesiva (rect + texto) ── */
function BoardSticky({
  obj,
  editing,
  onSelect,
  onEdit,
  onChange,
  snap,
  snapVal,
  draggable,
}: {
  obj: BoardObject
  editing: boolean
  onSelect: (additive: boolean) => void
  onEdit: () => void
  onChange: (o: BoardObject) => void
  snap: boolean
  snapVal: (v: number) => number
  draggable: boolean
}) {
  const ref = useRef<Konva.Group>(null)
  return (
    <Group
      ref={ref}
      name={obj.id}
      x={obj.x}
      y={obj.y}
      rotation={obj.rotation}
      opacity={(obj.opacity ?? 100) / 100}
      visible={obj.visible !== false}
      draggable={draggable}
      onClick={(e) => onSelect(e.evt.shiftKey)}
      onTap={(e) => onSelect(e.evt.shiftKey)}
      onDblClick={onEdit}
      onDblTap={onEdit}
      onDragMove={(e) => {
        if (snap) {
          e.target.x(snapVal(e.target.x()))
          e.target.y(snapVal(e.target.y()))
        }
      }}
      onDragEnd={(e) => onChange({ ...obj, x: e.target.x(), y: e.target.y() })}
      onTransformEnd={() => {
        const node = ref.current
        if (!node) return
        const scaleX = node.scaleX()
        const scaleY = node.scaleY()
        node.scaleX(1)
        node.scaleY(1)
        onChange({
          ...obj,
          x: node.x(),
          y: node.y(),
          w: Math.max(40, obj.w * scaleX),
          h: Math.max(40, obj.h * scaleY),
          rotation: node.rotation(),
        })
      }}
    >
      <Rect width={obj.w} height={obj.h} fill={obj.color || '#FDE68A'} cornerRadius={4} shadowColor="#000" shadowBlur={6} shadowOpacity={0.2} shadowOffsetY={2} />
      <KonvaText
        visible={!editing}
        text={obj.text || ' '}
        width={obj.w}
        height={obj.h}
        padding={10}
        fontSize={obj.fontSize || 18}
        fontFamily={obj.fontFamily || DEFAULT_FONT}
        fontStyle={konvaFontStyle(obj)}
        textDecoration={obj.underline ? 'underline' : ''}
        fill={obj.textColor || '#1f2937'}
        align={obj.align || 'left'}
        verticalAlign="top"
      />
    </Group>
  )
}

/* ── Figura geométrica (rect / elipse / línea / flecha) ── */
function BoardShape({
  obj,
  onSelect,
  onChange,
  snap,
  snapVal,
  draggable,
}: {
  obj: BoardObject
  onSelect: (additive: boolean) => void
  onChange: (o: BoardObject) => void
  snap: boolean
  snapVal: (v: number) => number
  draggable: boolean
}) {
  const ref = useRef<Konva.Group>(null)
  // 'transparent' (no undefined) mantiene el interior clicable aunque esté vacío.
  const fill = obj.fill ?? 'transparent'
  const stroke = obj.stroke ?? '#e8e8e8'
  const strokeWidth = obj.strokeWidth ?? 2

  // Geometría centrada en el origen del Group → rota/escala desde el centro
  // (no desde la esquina). El modelo sigue guardando x,y como esquina sup-izq.
  const cx = obj.w / 2
  const cy = obj.h / 2

  return (
    <Group
      ref={ref}
      name={obj.id}
      x={obj.x + cx}
      y={obj.y + cy}
      rotation={obj.rotation}
      opacity={(obj.opacity ?? 100) / 100}
      visible={obj.visible !== false}
      draggable={draggable}
      onClick={(e) => onSelect(e.evt.shiftKey)}
      onTap={(e) => onSelect(e.evt.shiftKey)}
      onDragMove={(e) => {
        if (snap) {
          e.target.x(snapVal(e.target.x() - cx) + cx)
          e.target.y(snapVal(e.target.y() - cy) + cy)
        }
      }}
      onDragEnd={(e) => onChange({ ...obj, x: e.target.x() - cx, y: e.target.y() - cy })}
      onTransformEnd={() => {
        const node = ref.current
        if (!node) return
        const scaleX = node.scaleX()
        const scaleY = node.scaleY()
        node.scaleX(1)
        node.scaleY(1)
        const w = Math.max(5, obj.w * scaleX)
        const h = Math.max(0, obj.h * scaleY)
        onChange({
          ...obj,
          w,
          h,
          rotation: node.rotation(),
          x: node.x() - w / 2,
          y: node.y() - h / 2,
        })
      }}
    >
      {obj.type === 'rect' && (
        <Rect x={-cx} y={-cy} width={obj.w} height={obj.h} fill={fill} stroke={stroke} strokeWidth={strokeWidth} cornerRadius={4} />
      )}
      {obj.type === 'ellipse' && (
        <Ellipse x={0} y={0} radiusX={cx} radiusY={cy} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      )}
      {obj.type === 'line' && (
        <Line points={[-cx, -cy, cx, cy]} stroke={stroke} strokeWidth={strokeWidth} lineCap="round" hitStrokeWidth={Math.max(12, strokeWidth)} />
      )}
      {obj.type === 'arrow' && (
        <Arrow points={[-cx, -cy, cx, cy]} stroke={stroke} fill={stroke} strokeWidth={strokeWidth} pointerLength={10 + strokeWidth} pointerWidth={10 + strokeWidth} hitStrokeWidth={Math.max(12, strokeWidth)} />
      )}
    </Group>
  )
}

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
    squareCm: 2,
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

        // Handoff: imagen entrante de otra herramienta (?handoff=1).
        const params = new URLSearchParams(window.location.search)
        if (d.isOwner && params.get('handoff') === '1') {
          window.history.replaceState(null, '', `/dashboard/boards/${boardId}`)
          const p = takeHandoff()
          if (p) {
            const w = pxOf(p.widthCm)
            const h = pxOf(p.heightCm)
            if (p.squareCm && bg) bg = { ...bg, squareCm: p.squareCm }
            const target = p.objectId ? objs.find((o) => o.id === p.objectId) : null
            if (target) {
              objs = objs.map((o) => (o.id === p.objectId ? { ...o, src: p.imageUrl, w, h } : o))
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
  const round1 = (n: number) => Math.round(n * 10) / 10
  // pantalla → mundo
  const toWorld = (sx: number, sy: number) => ({ x: (sx - pos.x) / scale, y: (sy - pos.y) / scale })

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
    setHandoff({
      imageUrl: o.src,
      widthCm: cmOf(o.w),
      heightCm: cmOf(o.h),
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

  const LAYER_NAMES: Record<string, string> = {
    image: 'Imagen', text: 'Texto', sticky: 'Nota',
    rect: 'Rectángulo', ellipse: 'Elipse', line: 'Línea', arrow: 'Flecha',
  }
  const layerLabel = (o: BoardObject) => o.name || LAYER_NAMES[o.type] || 'Capa'
  const LAYER_ICONS: Record<string, string> = {
    image: 'image', text: 'title', sticky: 'sticky_note_2',
    rect: 'rectangle', ellipse: 'circle', line: 'horizontal_rule', arrow: 'arrow_outward',
  }

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
    const next = Math.min(5, Math.max(0.1, oldScale * (e.evt.deltaY < 0 ? 1.08 : 1 / 1.08)))
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
    const next = Math.min(5, Math.max(0.1, scale * factor))
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

  const gridLines = useMemo(() => {
    if (background.type !== 'grid' || stageSize.w === 0) return { minor: [], major: [] }
    const major = Math.max(8, background.squareCm * PX_PER_CM)
    const minor = major / 2
    const left = -pos.x / scale
    const top = -pos.y / scale
    const right = (stageSize.w - pos.x) / scale
    const bottom = (stageSize.h - pos.y) / scale
    const build = (gap: number) => {
      const out: { points: number[]; key: string }[] = []
      const sx = Math.floor(left / gap) * gap
      const sy = Math.floor(top / gap) * gap
      for (let x = sx; x <= right; x += gap) out.push({ points: [x, top, x, bottom], key: `v${x}` })
      for (let y = sy; y <= bottom; y += gap) out.push({ points: [left, y, right, y], key: `h${y}` })
      return out
    }
    // Oculta las menores cuando quedan demasiado juntas en pantalla.
    return { minor: minor * scale > 6 ? build(minor) : [], major: build(major) }
  }, [background.type, background.squareCm, stageSize, pos, scale])

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

  const iconBtn =
    'flex items-center justify-center w-10 h-10 rounded-lg border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors shrink-0 disabled:opacity-40'

  // Islas flotantes (estilo Figma): glassmorphism + sombra.
  const island = 'absolute z-30 bg-[var(--color-surface-container)]/85 backdrop-blur-md border border-[var(--color-outline-variant)] shadow-xl'
  const islandIdle =
    'flex items-center justify-center w-10 h-10 rounded-xl text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-primary)] transition-colors disabled:opacity-40'
  const islandOn = (on: boolean) =>
    `flex items-center justify-center w-10 h-10 rounded-xl transition-colors disabled:opacity-40 ${
      on ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]' : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-primary)]'
    }`

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      {/* Barra superior (mínima): documento global */}
      <div className="bg-[var(--color-surface-container)] border-b border-[var(--color-outline-variant)] shrink-0 px-4 py-2 flex items-center gap-3">
        <Link href="/dashboard/boards" className={iconBtn} title="Volver al dashboard">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={readOnly}
          className="bg-transparent font-sans font-semibold text-[var(--color-primary)] border-b border-transparent hover:border-[var(--color-outline-variant)] focus:border-[var(--color-primary)] outline-none px-1 py-0.5 min-w-[120px] max-w-[320px]"
        />
        <div className="flex-1" />
        <span className="font-mono text-[10px] text-[var(--color-on-surface-variant)] shrink-0">
          {readOnly ? 'Solo lectura' : saveState === 'saving' ? 'Guardando…' : saveState === 'saved' ? 'Guardado' : ''}
        </span>
        {!readOnly && (
          <>
            <button onClick={undo} className={iconBtn} title="Deshacer (Ctrl+Z)">
              <span className="material-symbols-outlined text-[20px]">undo</span>
            </button>
            <button onClick={redo} className={iconBtn} title="Rehacer (Ctrl+Shift+Z)">
              <span className="material-symbols-outlined text-[20px]">redo</span>
            </button>
          </>
        )}
        <button onClick={downloadBoard} className={iconBtn} title="Descargar como PNG">
          <span className="material-symbols-outlined text-[20px]">download</span>
        </button>
      </div>

      {/* Panel de formato de texto (texto / nota seleccionados) */}
      {!readOnly && selectedObj && (selectedObj.type === 'text' || selectedObj.type === 'sticky') && (() => {
        const o = selectedObj
        const isSticky = o.type === 'sticky'
        const textColor = isSticky ? o.textColor || '#1f2937' : o.color || '#e8e8e8'
        const setTextColor = (v: string) => patchSelected(isSticky ? { textColor: v } : { color: v })
        const tog = (active: boolean) =>
          `flex items-center justify-center w-9 h-9 rounded-md border transition-colors shrink-0 ${
            active
              ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] border-[var(--color-primary)]'
              : 'border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]'
          }`
        const swatch =
          'w-9 h-9 rounded-md border border-[var(--color-outline-variant)] hover:border-[var(--color-primary)] transition-colors relative overflow-hidden shrink-0'
        return (
          <div className="bg-[var(--color-surface-container-low)] border-b border-[var(--color-outline-variant)] shrink-0 px-4 py-2 flex items-center gap-2 overflow-x-auto whitespace-nowrap animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Fuente */}
            <select
              value={o.fontFamily || DEFAULT_FONT}
              onChange={(e) => patchSelected({ fontFamily: e.target.value })}
              className="h-9 px-2 rounded-md bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] font-sans text-sm text-[var(--color-on-surface)] outline-none focus:border-[var(--color-primary)]"
              title="Fuente"
              style={{ fontFamily: o.fontFamily || DEFAULT_FONT }}
            >
              {BOARD_FONTS.map((f) => (
                <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                  {f.label}
                </option>
              ))}
            </select>

            {/* Tamaño */}
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => patchSelected({ fontSize: Math.max(8, (o.fontSize || 20) - 2) })} className={tog(false)} title="Menos">
                <span className="material-symbols-outlined text-[18px]">remove</span>
              </button>
              <input
                type="number"
                min={8}
                max={400}
                value={o.fontSize || 20}
                onChange={(e) => patchSelected({ fontSize: Math.max(8, Math.min(400, Number(e.target.value) || 20)) })}
                className="w-14 h-9 bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] rounded-md px-2 font-mono text-sm text-center text-[var(--color-on-surface)] outline-none focus:border-[var(--color-primary)]"
                title="Tamaño"
              />
              <button onClick={() => patchSelected({ fontSize: Math.min(400, (o.fontSize || 20) + 2) })} className={tog(false)} title="Más">
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
            </div>

            <span className="w-px h-6 bg-[var(--color-outline-variant)]/60 shrink-0" />

            {/* Negrita / Cursiva / Subrayado */}
            <button onClick={() => patchSelected({ bold: !o.bold })} className={tog(!!o.bold)} title="Negrita">
              <span className="material-symbols-outlined text-[18px]">format_bold</span>
            </button>
            <button onClick={() => patchSelected({ italic: !o.italic })} className={tog(!!o.italic)} title="Cursiva">
              <span className="material-symbols-outlined text-[18px]">format_italic</span>
            </button>
            <button onClick={() => patchSelected({ underline: !o.underline })} className={tog(!!o.underline)} title="Subrayado">
              <span className="material-symbols-outlined text-[18px]">format_underlined</span>
            </button>

            <span className="w-px h-6 bg-[var(--color-outline-variant)]/60 shrink-0" />

            {/* Alineación */}
            <button onClick={() => patchSelected({ align: 'left' })} className={tog(o.align === 'left' || !o.align)} title="Izquierda">
              <span className="material-symbols-outlined text-[18px]">format_align_left</span>
            </button>
            <button onClick={() => patchSelected({ align: 'center' })} className={tog(o.align === 'center')} title="Centro">
              <span className="material-symbols-outlined text-[18px]">format_align_center</span>
            </button>
            <button onClick={() => patchSelected({ align: 'right' })} className={tog(o.align === 'right')} title="Derecha">
              <span className="material-symbols-outlined text-[18px]">format_align_right</span>
            </button>

            <span className="w-px h-6 bg-[var(--color-outline-variant)]/60 shrink-0" />

            {/* Color de texto */}
            <label className={swatch} title="Color de texto" style={{ background: textColor }}>
              <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="absolute inset-[-8px] w-16 h-16 cursor-pointer opacity-0" />
            </label>

            {/* Color de fondo (solo nota) */}
            {isSticky && (
              <label className={swatch} title="Color de nota" style={{ background: o.color || '#FDE68A' }}>
                <input type="color" value={o.color || '#FDE68A'} onChange={(e) => patchSelected({ color: e.target.value })} className="absolute inset-[-8px] w-16 h-16 cursor-pointer opacity-0" />
              </label>
            )}
          </div>
        )
      })()}

      {/* Panel de estilo de figuras */}
      {!readOnly && selectedObj && isShape(selectedObj.type) && (() => {
        const o = selectedObj
        const hasFill = o.type === 'rect' || o.type === 'ellipse'
        const filled = !!o.fill && o.fill !== 'transparent'
        const swatch =
          'w-9 h-9 rounded-md border border-[var(--color-outline-variant)] hover:border-[var(--color-primary)] transition-colors relative overflow-hidden shrink-0'
        const tog =
          'flex items-center justify-center w-9 h-9 rounded-md border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors shrink-0'
        return (
          <div className="bg-[var(--color-surface-container-low)] border-b border-[var(--color-outline-variant)] shrink-0 px-4 py-2 flex items-center gap-2 overflow-x-auto whitespace-nowrap animate-in fade-in slide-in-from-top-2 duration-200">
            {hasFill && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-on-surface-variant)]">Relleno</span>
                {/* Toggle: vacío ↔ relleno */}
                <button
                  onClick={() => patchSelected({ fill: filled ? 'transparent' : o.stroke || '#60a5fa' })}
                  className={`flex items-center justify-center w-9 h-9 rounded-md border transition-colors shrink-0 ${
                    filled
                      ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] border-[var(--color-primary)]'
                      : 'border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]'
                  }`}
                  title={filled ? 'Quitar relleno' : 'Rellenar'}
                >
                  <span className="material-symbols-outlined text-[18px]">{filled ? 'format_color_fill' : 'format_color_reset'}</span>
                </button>
                {/* Swatch (solo si está relleno) */}
                {filled && (
                  <span className={swatch} style={{ background: o.fill }}>
                    <input type="color" value={o.fill || '#60a5fa'} onChange={(e) => patchSelected({ fill: e.target.value })} className="absolute inset-[-8px] w-16 h-16 cursor-pointer opacity-0" />
                  </span>
                )}
                <span className="w-px h-6 bg-[var(--color-outline-variant)]/60 shrink-0" />
              </div>
            )}

            <label className="flex items-center gap-2 shrink-0">
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-on-surface-variant)]">Borde</span>
              <span className={swatch} style={{ background: o.stroke || '#1e293b' }}>
                <input type="color" value={o.stroke || '#1e293b'} onChange={(e) => patchSelected({ stroke: e.target.value })} className="absolute inset-[-8px] w-16 h-16 cursor-pointer opacity-0" />
              </span>
            </label>

            <span className="w-px h-6 bg-[var(--color-outline-variant)]/60 shrink-0" />

            <div className="flex items-center gap-1 shrink-0">
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-on-surface-variant)]">Grosor</span>
              <button onClick={() => patchSelected({ strokeWidth: Math.max(0, (o.strokeWidth ?? 2) - 1) })} className={tog} title="Menos">
                <span className="material-symbols-outlined text-[18px]">remove</span>
              </button>
              <input
                type="number"
                min={0}
                max={60}
                value={o.strokeWidth ?? 2}
                onChange={(e) => patchSelected({ strokeWidth: Math.max(0, Math.min(60, Number(e.target.value) || 0)) })}
                className="w-14 h-9 bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] rounded-md px-2 font-mono text-sm text-center text-[var(--color-on-surface)] outline-none focus:border-[var(--color-primary)]"
              />
              <button onClick={() => patchSelected({ strokeWidth: Math.min(60, (o.strokeWidth ?? 2) + 1) })} className={tog} title="Más">
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
            </div>
          </div>
        )
      })()}

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
            <Layer listening={false}>
              {gridLines.minor.map((l) => (
                <Line key={`mi${l.key}`} points={l.points} stroke={gridColor} strokeWidth={1 / scale} opacity={(background.opacity / 100) * 0.45} />
              ))}
              {gridLines.major.map((l) => (
                <Line key={`ma${l.key}`} points={l.points} stroke={gridColor} strokeWidth={1.25 / scale} opacity={background.opacity / 100} />
              ))}
            </Layer>

            {/* Capa de objetos */}
            <Layer>
              {sorted.map((obj) => {
                const onSelect = (additive: boolean) => !readOnly && selectObject(obj.id, additive)
                const onEdit = () => !readOnly && !obj.locked && (setSelectedIds([obj.id]), setEditingId(obj.id))
                const draggable = tool === 'select' && !obj.locked && !readOnly
                if (obj.type === 'image')
                  return <URLImage key={obj.id} obj={obj} isSelected={selectedIds.includes(obj.id)} onSelect={onSelect} onChange={updateObject} snap={snap} snapVal={snapVal} draggable={draggable} />
                if (obj.type === 'text')
                  return <BoardText key={obj.id} obj={obj} editing={obj.id === editingId} onSelect={onSelect} onEdit={onEdit} onChange={updateObject} snap={snap} snapVal={snapVal} draggable={draggable} />
                if (obj.type === 'sticky')
                  return <BoardSticky key={obj.id} obj={obj} editing={obj.id === editingId} onSelect={onSelect} onEdit={onEdit} onChange={updateObject} snap={snap} snapVal={snapVal} draggable={draggable} />
                if (isShape(obj.type))
                  return <BoardShape key={obj.id} obj={obj} onSelect={onSelect} onChange={updateObject} snap={snap} snapVal={snapVal} draggable={draggable} />
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
            {measure && (
              <Layer listening={false}>
                <Line
                  points={[measure.ax, measure.ay, measure.bx, measure.by]}
                  stroke="#f43f5e"
                  strokeWidth={1.5 / scale}
                  dash={[6 / scale, 4 / scale]}
                />
                <Line points={[measure.ax, measure.ay, measure.ax, measure.ay]} stroke="#f43f5e" strokeWidth={6 / scale} lineCap="round" />
                <Line points={[measure.bx, measure.by, measure.bx, measure.by]} stroke="#f43f5e" strokeWidth={6 / scale} lineCap="round" />
              </Layer>
            )}
          </Stage>
        )}

        {/* Isla izquierda: herramientas + creación */}
        {!readOnly && (
          <div className={`${island} left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 p-1.5 rounded-2xl`}>
            <button onClick={() => { setTool('select'); setMeasure(null) }} title="Seleccionar (V)" className={islandOn(tool === 'select')}>
              <span className="material-symbols-outlined text-[20px]">arrow_selector_tool</span>
            </button>
            <button onClick={() => { setTool('hand'); setMeasure(null) }} title="Mover tablero (H · Espacio · botón central)" className={islandOn(tool === 'hand')}>
              <span className="material-symbols-outlined text-[20px]">pan_tool</span>
            </button>
            <button onClick={() => setTool('measure')} title="Medir distancia (M)" className={islandOn(tool === 'measure')}>
              <span className="material-symbols-outlined text-[20px]">straighten</span>
            </button>
            <span className="h-px w-7 mx-auto bg-[var(--color-outline-variant)]/60 my-0.5" />
            <button onClick={() => setModalOpen(true)} title="Añadir imagen" className={islandIdle}>
              <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
            </button>
            <button onClick={addText} title="Añadir texto" className={islandIdle}>
              <span className="material-symbols-outlined text-[20px]">title</span>
            </button>
            <button onClick={addSticky} title="Añadir nota" className={islandIdle}>
              <span className="material-symbols-outlined text-[20px]">sticky_note_2</span>
            </button>
            <button onClick={() => addShape('rect')} title="Rectángulo" className={islandIdle}>
              <span className="material-symbols-outlined text-[20px]">rectangle</span>
            </button>
            <button onClick={() => addShape('ellipse')} title="Elipse" className={islandIdle}>
              <span className="material-symbols-outlined text-[20px]">circle</span>
            </button>
            <button onClick={() => addShape('line')} title="Línea" className={islandIdle}>
              <span className="material-symbols-outlined text-[20px]">horizontal_rule</span>
            </button>
            <button onClick={() => addShape('arrow')} title="Flecha" className={islandIdle}>
              <span className="material-symbols-outlined text-[20px]">arrow_outward</span>
            </button>
          </div>
        )}

        {/* Isla derecha: inspector contextual + capas */}
        {!readOnly && (
          <div className={`${island} right-3 top-3 flex flex-col gap-1 p-1.5 rounded-2xl w-[52px] items-center`}>
            {selectedIds.length ? (
              <>
                <button onClick={toggleLock} title="Bloquear / Desbloquear" className={islandOn(selectedIds.every((id) => objects.find((o) => o.id === id)?.locked))}>
                  <span className="material-symbols-outlined text-[20px]">{selectedIds.every((id) => objects.find((o) => o.id === id)?.locked) ? 'lock' : 'lock_open'}</span>
                </button>
                <button onClick={duplicateSelection} title="Duplicar (Ctrl+D)" className={islandIdle}>
                  <span className="material-symbols-outlined text-[20px]">content_copy</span>
                </button>
                <button onClick={bringToFront} title="Traer al frente" className={islandIdle}>
                  <span className="material-symbols-outlined text-[20px]">flip_to_front</span>
                </button>
                <button onClick={sendToBack} title="Enviar al fondo" className={islandIdle}>
                  <span className="material-symbols-outlined text-[20px]">flip_to_back</span>
                </button>
                {selectedObj?.type === 'image' && (
                  <>
                    <button onClick={() => editIn('crop')} title="Editar en Recorte / Quitar fondo" className={islandIdle}>
                      <span className="material-symbols-outlined text-[20px]">crop</span>
                    </button>
                    <button onClick={() => editIn('grid')} title="Medir en Cuadrícula" className={islandIdle}>
                      <span className="material-symbols-outlined text-[20px]">grid_on</span>
                    </button>
                  </>
                )}
                <button onClick={deleteSelected} title="Borrar (Supr)" className={`${islandIdle} hover:!bg-red-500/15 hover:!text-red-500`}>
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setBackground((b) => ({ ...b, type: b.type === 'grid' ? 'plain' : 'grid' }))} title="Fondo: milimetrado / liso" className={islandOn(background.type === 'grid')}>
                  <span className="material-symbols-outlined text-[20px]">grid_on</span>
                </button>
                <button onClick={() => setSnap((s) => !s)} disabled={background.type !== 'grid'} title="Imán a la cuadrícula" className={islandOn(snap && background.type === 'grid')}>
                  <span className="material-symbols-outlined text-[20px]">polyline</span>
                </button>
                {background.type === 'grid' && (
                  <input
                    type="number"
                    min={0.1}
                    step={0.5}
                    value={round1(background.squareCm)}
                    onChange={(e) => setBackground((b) => ({ ...b, squareCm: Math.max(0.1, Number(e.target.value) || 0.1) }))}
                    title="cm por cuadro"
                    className="w-10 h-8 bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)] rounded-md px-1 font-mono text-[11px] text-center text-[var(--color-on-surface)] outline-none focus:border-[var(--color-primary)]"
                  />
                )}
              </>
            )}
            <span className="h-px w-7 bg-[var(--color-outline-variant)]/60 my-0.5" />
            <button onClick={() => setLayersOpen((v) => !v)} title="Capas" className={islandOn(layersOpen)}>
              <span className="material-symbols-outlined text-[20px]">layers</span>
            </button>
          </div>
        )}

        {/* Isla inferior izquierda: controles de vista */}
        <div className={`${island} left-3 bottom-3 flex items-center gap-0.5 p-1 rounded-full`}>
          <button onClick={() => zoomBy(1 / 1.2)} title="Alejar" className={islandIdle}>
            <span className="material-symbols-outlined text-[20px]">remove</span>
          </button>
          <button onClick={resetView} title="Centrar vista" className="font-mono text-[11px] text-[var(--color-on-surface)] px-2 h-10 min-w-[48px] hover:text-[var(--color-primary)] transition-colors">
            {Math.round(scale * 100)}%
          </button>
          <button onClick={() => zoomBy(1.2)} title="Acercar" className={islandIdle}>
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>
        </div>

        {/* Panel de capas (isla flotante) */}
        {!readOnly && layersOpen && (
          <div className="absolute bottom-4 right-4 w-64 max-h-[60%] bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] rounded-xl shadow-2xl flex flex-col z-30 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between px-3 h-10 border-b border-[var(--color-outline-variant)] shrink-0">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-on-surface-variant)]">Capas</span>
              <button onClick={() => setLayersOpen(false)} className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <ul className="flex-1 overflow-y-auto custom-scrollbar">
              {[...objects].sort((a, b) => b.z - a.z).map((o) => {
                const sel = selectedIds.includes(o.id)
                const hidden = o.visible === false
                return (
                  <li
                    key={o.id}
                    draggable
                    onDragStart={() => { dragLayer.current = o.id }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => { if (dragLayer.current) moveLayer(dragLayer.current, o.id); dragLayer.current = null }}
                    onClick={() => setSelectedIds([o.id])}
                    className={`group flex items-center gap-1.5 px-2 h-9 cursor-pointer border-l-2 ${
                      sel ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]' : 'border-transparent hover:bg-[var(--color-surface-container-high)]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px] text-[var(--color-on-surface-variant)]/40 cursor-grab">drag_indicator</span>
                    <button onClick={(e) => { e.stopPropagation(); toggleLayerVisible(o.id) }} className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] shrink-0" title={hidden ? 'Mostrar' : 'Ocultar'}>
                      <span className="material-symbols-outlined text-[18px]">{hidden ? 'visibility_off' : 'visibility'}</span>
                    </button>
                    <span className={`material-symbols-outlined text-[16px] text-[var(--color-on-surface-variant)] shrink-0 ${hidden ? 'opacity-40' : ''}`}>{LAYER_ICONS[o.type]}</span>
                    <input
                      value={layerLabel(o)}
                      onChange={(e) => patchObject(o.id, { name: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      className={`flex-1 min-w-0 bg-transparent text-xs text-[var(--color-on-surface)] outline-none truncate focus:text-[var(--color-primary)] ${hidden ? 'opacity-40' : ''}`}
                    />
                    <button onClick={(e) => { e.stopPropagation(); toggleLayerLock(o.id) }} className={`shrink-0 hover:text-[var(--color-primary)] ${o.locked ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)]/40 group-hover:text-[var(--color-on-surface-variant)]'}`} title={o.locked ? 'Desbloquear' : 'Bloquear'}>
                      <span className="material-symbols-outlined text-[16px]">{o.locked ? 'lock' : 'lock_open'}</span>
                    </button>
                  </li>
                )
              })}
              {objects.length === 0 && (
                <li className="px-3 py-5 text-center text-[10px] font-mono uppercase tracking-widest text-[var(--color-on-surface-variant)]/60">Sin capas</li>
              )}
            </ul>
            {selectedObj && (
              <div className="border-t border-[var(--color-outline-variant)] px-3 py-2 shrink-0 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-[var(--color-on-surface-variant)]">opacity</span>
                <input type="range" min={0} max={100} value={selectedObj.opacity ?? 100} onChange={(e) => patchObject(selectedObj.id, { opacity: Number(e.target.value) })} className="flex-1 custom-range" />
                <span className="font-mono text-[10px] text-[var(--color-primary)] w-9 text-right">{selectedObj.opacity ?? 100}%</span>
              </div>
            )}
          </div>
        )}

        {/* Recuadro de selección (rubber band) */}
        {selRect && (selRect.w > 0 || selRect.h > 0) && (
          <div
            className="absolute border border-[var(--color-primary)] bg-[var(--color-primary)]/10 pointer-events-none z-10"
            style={{ left: selRect.x, top: selRect.y, width: selRect.w, height: selRect.h }}
          />
        )}

        {/* Etiqueta de distancia de la regla */}
        {measure && (() => {
          const distCm = round1(cmOf(Math.hypot(measure.bx - measure.ax, measure.by - measure.ay)))
          const mx = pos.x + ((measure.ax + measure.bx) / 2) * scale
          const my = pos.y + ((measure.ay + measure.by) / 2) * scale
          
          const m = distCm / 100
          const mStr = Number.isInteger(m) ? m.toString() : m.toFixed(2).replace(/\.?0+$/, '')
          
          return (
            <div className="absolute -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-rose-500 text-white font-mono text-[11px] pointer-events-none z-20 whitespace-nowrap shadow" style={{ left: mx, top: my }}>
              {distCm} cm {distCm >= 10 && `(${mStr} m)`}
            </div>
          )
        })()}

        {/* Cota de tamaño real del objeto seleccionado */}
        {selectedObj && !editingId && (() => {
          const o = selectedObj
          const isLin = o.type === 'line' || o.type === 'arrow'
          const wCm = round1(cmOf(o.w))
          const hCm = round1(cmOf(o.h))
          const diagCm = round1(cmOf(Math.hypot(o.w, o.h)))
          
          const fmtM = (cm: number) => {
            if (cm < 10) return ''
            const m = cm / 100
            return ` (${Number.isInteger(m) ? m.toString() : m.toFixed(2).replace(/\.?0+$/, '')} m)`
          }

          const label = isLin
            ? `${diagCm} cm${fmtM(diagCm)}`
            : `${wCm} cm${fmtM(wCm)} × ${hCm} cm${fmtM(hCm)}`
            
          const left = pos.x + (o.x + o.w / 2) * scale
          const top = pos.y + (o.y + o.h) * scale + 8
          return (
            <div className="absolute -translate-x-1/2 px-1.5 py-0.5 rounded bg-[var(--color-primary)] text-[var(--color-on-primary)] font-mono text-[10px] pointer-events-none z-20 whitespace-nowrap" style={{ left, top }}>
              {label}
            </div>
          )
        })()}

        {loaded && objects.length === 0 && !readOnly && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none text-[var(--color-on-surface-variant)]">
            <span className="material-symbols-outlined text-5xl">add_photo_alternate</span>
            <span className="font-mono text-[var(--text-label-sm)] uppercase tracking-widest">Añade imagen, texto o nota para empezar</span>
          </div>
        )}

        {/* Edición de texto inline (textarea sobre el nodo) */}
        {editingObj && (
          <textarea
            ref={editTextRef}
            value={editingObj.text || ''}
            onChange={(e) => commitEditText(e.target.value)}
            onBlur={finishEditing}
            onKeyDown={(e) => {
              if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) {
                e.preventDefault()
                finishEditing()
              }
            }}
            placeholder="Escribe…"
            className="absolute z-20 resize-none outline-none border border-[var(--color-primary)] overflow-hidden"
            style={{
              left: pos.x + editingObj.x * scale,
              top: pos.y + editingObj.y * scale,
              width: editingObj.w * scale,
              minHeight: editingObj.h * scale,
              fontSize: (editingObj.fontSize || 20) * scale,
              fontFamily: editingObj.fontFamily || DEFAULT_FONT,
              fontWeight: editingObj.bold ? 700 : 400,
              fontStyle: editingObj.italic ? 'italic' : 'normal',
              textDecoration: editingObj.underline ? 'underline' : 'none',
              textAlign: editingObj.align || 'left',
              lineHeight: 1.2,
              padding: (editingObj.type === 'sticky' ? 10 : 0) * scale,
              color: editingObj.type === 'sticky' ? editingObj.textColor || '#1f2937' : editingObj.color || '#e8e8e8',
              background: editingObj.type === 'sticky' ? editingObj.color || '#FDE68A' : 'rgba(0,0,0,0.4)',
              transform: editingObj.rotation ? `rotate(${editingObj.rotation}deg)` : undefined,
              transformOrigin: 'top left',
            }}
          />
        )}
      </div>

      {/* Footer: escala + dimensiones exactas del objeto seleccionado */}
      <div className="bg-[var(--color-surface-container)] border-t border-[var(--color-outline-variant)] shrink-0 px-4 py-1.5 flex items-center gap-4 overflow-x-auto whitespace-nowrap font-mono text-[10px] text-[var(--color-on-surface-variant)]">
        <span className="shrink-0">
          1 cuadro = <span className="text-[var(--color-primary)]">{round1(background.squareCm)} cm</span>
        </span>
        <span className="opacity-40">·</span>
        <span className="shrink-0">{objects.length} objeto{objects.length === 1 ? '' : 's'}</span>
        {selectedIds.length > 1 && (
          <>
            <span className="opacity-40">·</span>
            <span className="shrink-0 text-[var(--color-primary)]">{selectedIds.length} seleccionados</span>
          </>
        )}

        <div className="flex-1" />

        {!readOnly && selectedObj && (() => {
          const o = selectedObj
          const dim =
            'w-16 h-7 bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)] rounded px-1.5 font-mono text-[11px] text-center text-[var(--color-on-surface)] outline-none focus:border-[var(--color-primary)]'
          const field = (label: string, value: number, set: (cm: number) => void, unit = 'cm') => (
            <label className="flex items-center gap-1 shrink-0">
              <span className="uppercase tracking-[0.08em]">{label}</span>
              <input
                type="number"
                step={0.1}
                value={round1(value)}
                onChange={(e) => set(Number(e.target.value) || 0)}
                className={dim}
              />
              <span className="opacity-60">{unit}</span>
            </label>
          )
          return (
            <div className="flex items-center gap-2.5 shrink-0">
              {field('X', cmOf(o.x), (cm) => patchSelected({ x: pxOf(cm) }))}
              {field('Y', cmOf(o.y), (cm) => patchSelected({ y: pxOf(cm) }))}
              {field('An', cmOf(o.w), (cm) => patchSelected({ w: Math.max(0, pxOf(cm)) }))}
              {field('Al', cmOf(o.h), (cm) => patchSelected({ h: Math.max(0, pxOf(cm)) }))}
              {field('∠', o.rotation || 0, (deg) => patchSelected({ rotation: deg }), '°')}
            </div>
          )
        })()}
      </div>

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
