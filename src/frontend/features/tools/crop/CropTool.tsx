'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import ImageSourceModal from '@frontend/features/tools/shared/ImageSourceModal'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { loadImage, imageToCanvas, cropCanvas, canvasToBlob, downloadBlob, uploadBlob } from '@shared/lib/image/canvas'
import { computeContentBounds, padBounds, type Bounds } from '@shared/lib/image/autocrop'
import { setHandoff, takeHandoff } from '@shared/lib/tools/handoff'
import { cmOf, applyScale, formatCm, formatScaled } from '@shared/lib/measure'
import ToolWorkspace from '@frontend/features/tools/shared/workspace/ToolWorkspace'
import { ToolRow, ToolPanelFooter } from '@frontend/features/tools/shared/workspace/ToolPanel'
import ToolCluster from '@frontend/features/tools/shared/workspace/ToolCluster'
import ToolButton from '@frontend/features/tools/shared/workspace/ToolButton'
import ToolSlider from '@frontend/features/tools/shared/workspace/ToolSlider'
import ToolSelect from '@frontend/features/tools/shared/workspace/ToolSelect'
import ToolStage from '@frontend/features/tools/shared/workspace/ToolStage'
import SourceButton from '@frontend/features/tools/shared/workspace/SourceButton'
import HistoryButtons from '@frontend/features/tools/shared/workspace/HistoryButtons'
import SendActions from '@frontend/features/tools/shared/workspace/SendActions'
import MeasureBar from '@frontend/features/tools/shared/workspace/MeasureBar'

type DragMode = 'move' | 'nw' | 'ne' | 'sw' | 'se' | null

const ASPECTS: { label: string; value: number | null }[] = [
  { label: 'Libre', value: null },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:4', value: 3 / 4 },
  { label: '16:9', value: 16 / 9 },
]

export default function CropTool() {
  const { t } = usePreferences()
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [crop, setCrop] = useState<Bounds>({ x: 0, y: 0, w: 0, h: 0 })
  const [aspectIdx, setAspectIdx] = useState('0')
  const [tolerance, setTolerance] = useState(18)
  const [padding, setPadding] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const stageRef = useRef<HTMLDivElement>(null)
  const [stage, setStage] = useState({ w: 0, h: 0 })
  const drag = useRef<{ mode: DragMode; sx: number; sy: number; crop: Bounds } | null>(null)
  const back = useRef<{ boardId?: string; objectId?: string } | null>(null)

  // Historial del recorte (paridad con las otras herramientas). Snapshot del
  // `crop` antes de cada cambio; undo/redo restauran. `cropRef` da el valor
  // actual sin re-suscribir el efecto de atajos.
  const cropRef = useRef(crop)
  cropRef.current = crop
  const pastCrop = useRef<Bounds[]>([])
  const futureCrop = useRef<Bounds[]>([])
  const [, setHistoryTick] = useState(0)
  const pushCrop = () => {
    pastCrop.current.push(cropRef.current)
    if (pastCrop.current.length > 30) pastCrop.current.shift()
    futureCrop.current = []
    setHistoryTick((n) => n + 1)
  }
  const undo = () => {
    if (!pastCrop.current.length) return
    futureCrop.current.push(cropRef.current)
    setCrop(pastCrop.current.pop()!)
    setHistoryTick((n) => n + 1)
  }
  const redo = () => {
    if (!futureCrop.current.length) return
    pastCrop.current.push(cropRef.current)
    setCrop(futureCrop.current.pop()!)
    setHistoryTick((n) => n + 1)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'SELECT') return
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handoff entrante (?handoff=1): carga la imagen pasada por otra herramienta.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('handoff') !== '1') return
    window.history.replaceState(null, '', '/dashboard/tools/crop')
    const p = takeHandoff()
    if (!p) return
    if (p.source === 'boards') back.current = { boardId: p.boardId, objectId: p.objectId }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setImageUrl(p.imageUrl)
  }, [])

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const ro = new ResizeObserver((e) => {
      const cr = e[0].contentRect
      setStage({ w: cr.width, h: cr.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!imageUrl) return
    let active = true
    loadImage(imageUrl)
      .then((image) => {
        if (!active) return
        setImg(image)
        setCrop({ x: 0, y: 0, w: image.naturalWidth, h: image.naturalHeight })
        pastCrop.current = []
        futureCrop.current = []
        setError(null)
      })
      .catch(() => active && setError(t('crop.errLoad')))
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl])

  const fit = useMemo(() => {
    if (!img || !stage.w) return { scale: 1, ox: 0, oy: 0, dw: 0, dh: 0 }
    const scale = Math.min(stage.w / img.naturalWidth, stage.h / img.naturalHeight)
    const dw = img.naturalWidth * scale
    const dh = img.naturalHeight * scale
    return { scale, ox: (stage.w - dw) / 2, oy: (stage.h - dh) / 2, dw, dh }
  }, [img, stage])

  const screen = {
    left: fit.ox + crop.x * fit.scale,
    top: fit.oy + crop.y * fit.scale,
    width: crop.w * fit.scale,
    height: crop.h * fit.scale,
  }

  const clamp = (c: Bounds): Bounds => {
    if (!img) return c
    const W = img.naturalWidth
    const H = img.naturalHeight
    let { x, y, w, h } = c
    w = Math.max(10, Math.min(w, W))
    h = Math.max(10, Math.min(h, H))
    x = Math.max(0, Math.min(x, W - w))
    y = Math.max(0, Math.min(y, H - h))
    return { x, y, w, h }
  }

  const startDrag = (mode: DragMode, e: React.PointerEvent) => {
    e.stopPropagation()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    pushCrop()
    drag.current = { mode, sx: e.clientX, sy: e.clientY, crop }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || !d.mode) return
    const dx = (e.clientX - d.sx) / fit.scale
    const dy = (e.clientY - d.sy) / fit.scale
    const c = { ...d.crop }
    if (d.mode === 'move') {
      c.x += dx
      c.y += dy
    } else {
      if (d.mode.includes('w')) { c.x += dx; c.w -= dx }
      if (d.mode.includes('e')) { c.w += dx }
      if (d.mode.includes('n')) { c.y += dy; c.h -= dy }
      if (d.mode.includes('s')) { c.h += dy }
    }
    setCrop(clamp(c))
  }
  const onPointerUp = () => { drag.current = null }

  const applyAspect = (idx: string) => {
    setAspectIdx(idx)
    const ratio = ASPECTS[Number(idx)].value
    if (!img || ratio === null) return
    pushCrop()
    const W = img.naturalWidth, H = img.naturalHeight
    let w = W, h = W / ratio
    if (h > H) { h = H; w = H * ratio }
    setCrop(clamp({ x: (W - w) / 2, y: (H - h) / 2, w, h }))
  }

  const autoCrop = () => {
    if (!img) return
    try {
      const canvas = imageToCanvas(img)
      const ctx = canvas.getContext('2d')!
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const b = computeContentBounds(data, tolerance)
      if (!b) { setError(t('crop.errNoContent')); return }
      pushCrop()
      setError(null)
      setCrop(padding ? padBounds(b, padding, canvas.width, canvas.height) : b)
    } catch {
      setError(t('crop.errAnalyze'))
    }
  }

  const exportPng = async () => {
    if (!img) return
    setBusy(true)
    try {
      const out = cropCanvas(img, crop)
      const blob = await canvasToBlob(out, 'image/png')
      downloadBlob(blob, 'crop.png')
    } catch {
      setError(t('crop.errExport'))
    } finally {
      setBusy(false)
    }
  }

  const reset = () => {
    if (!img) return
    pushCrop()
    setCrop({ x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight })
  }

  const sendTo = async (dest: 'boards' | 'grid' | 'back') => {
    if (!img) return
    setBusy(true)
    setError(null)
    try {
      const blob = await canvasToBlob(cropCanvas(img, crop), 'image/png')
      const url = await uploadBlob(blob, 'crop.png')
      const widthCm = cmOf(crop.w)
      const heightCm = cmOf(crop.h)
      const widthScaledCm = applyScale(widthCm)
      const heightScaledCm = applyScale(heightCm)
      if (dest === 'back' && back.current?.boardId) {
        setHandoff({ imageUrl: url, widthCm, heightCm, widthScaledCm, heightScaledCm, source: 'crop', boardId: back.current.boardId, objectId: back.current.objectId })
        router.push(`/dashboard/tools/boards/${back.current.boardId}?handoff=1`)
      } else if (dest === 'grid') {
        setHandoff({ imageUrl: url, widthCm, heightCm, widthScaledCm, heightScaledCm, source: 'crop' })
        router.push('/dashboard/tools/grid?handoff=1')
      } else {
        setHandoff({ imageUrl: url, widthCm, heightCm, widthScaledCm, heightScaledCm, source: 'crop' })
        router.push('/dashboard/tools/boards')
      }
    } catch {
      setError(t('crop.errSend'))
      setBusy(false)
    }
  }

  const handle = 'absolute w-3 h-3 bg-[var(--color-primary)] border border-white rounded-sm'
  const off = !img

  const panel = (
    <>
      <SourceButton onClick={() => setModalOpen(true)} />
      <ToolRow>
        <HistoryButtons
          fill
          canUndo={pastCrop.current.length > 0}
          canRedo={futureCrop.current.length > 0}
          onUndo={undo}
          onRedo={redo}
        />
        <ToolButton variant="icon" icon="restart_alt" title={t('crop.resetTip')} disabled={off} onClick={reset} className="flex-1 min-w-0" />
        <ToolButton variant="icon" icon="grid_on" title={t('tools.sendGrid')} disabled={off || busy} onClick={() => sendTo('grid')} className="flex-1 min-w-0" />
      </ToolRow>

      <ToolCluster name={t('crop.aspectRatio')}>
        <ToolSelect
          value={aspectIdx}
          title={t('crop.aspectRatio')}
          onChange={applyAspect}
          className="w-full"
          options={ASPECTS.map((a, i) => ({ value: String(i), label: a.value === null ? t('crop.free') : a.label }))}
        />
      </ToolCluster>

      <ToolCluster name={t('crop.autoCrop')}>
        <ToolButton variant="ghost" icon="crop_free" label={t('crop.auto')} title={t('crop.autoCrop')} disabled={off} onClick={autoCrop} className="w-full" />
        <ToolSlider icon="tune" min={0} max={60} value={tolerance} title={t('crop.autoCropTip')} onChange={setTolerance} />
        <label className="flex items-center justify-between gap-2" title={t('crop.padTip')}>
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-on-surface-variant)]">{t('crop.pad')}</span>
          <input type="number" min={0} value={padding} disabled={off} onChange={(e) => setPadding(Math.max(0, Number(e.target.value) || 0))} className="w-16 h-9 bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] rounded-lg px-2 font-mono text-label-sm text-center text-[var(--color-on-surface)] outline-none transition-colors duration-150 focus-visible:border-[var(--color-primary)]" />
        </label>
      </ToolCluster>

      <ToolPanelFooter>
        <SendActions
          isReturn={!!back.current?.boardId}
          busy={off || busy}
          showGrid={false}
          onBack={() => sendTo('back')}
          onSendBoards={() => sendTo('boards')}
          onExport={exportPng}
        />
      </ToolPanelFooter>
    </>
  )

  const stageNode = (
    <ToolStage
      stageRef={stageRef}
      hasImage={!!img}
      emptyIcon="crop"
      emptyPrompt={t('crop.uploadPromptCrop')}
      onPickImage={() => setModalOpen(true)}
      error={error}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl ?? undefined} alt="" draggable={false} className="absolute pointer-events-none" style={{ left: fit.ox, top: fit.oy, width: fit.dw, height: fit.dh }} />
      <div className="absolute pointer-events-none" style={{ left: screen.left, top: screen.top, width: screen.width, height: screen.height, boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }} />
      <div
        className="absolute border border-[var(--color-primary)] cursor-move"
        style={{ left: screen.left, top: screen.top, width: screen.width, height: screen.height }}
        onPointerDown={(e) => startDrag('move', e)}
      >
        <div className={`${handle} -left-1.5 -top-1.5 cursor-nwse-resize`} onPointerDown={(e) => startDrag('nw', e)} />
        <div className={`${handle} -right-1.5 -top-1.5 cursor-nesw-resize`} onPointerDown={(e) => startDrag('ne', e)} />
        <div className={`${handle} -left-1.5 -bottom-1.5 cursor-nesw-resize`} onPointerDown={(e) => startDrag('sw', e)} />
        <div className={`${handle} -right-1.5 -bottom-1.5 cursor-nwse-resize`} onPointerDown={(e) => startDrag('se', e)} />
      </div>
    </ToolStage>
  )

  return (
    <ToolWorkspace
      panel={panel}
      stage={stageNode}
      footer={img && (
        <MeasureBar
          referenceLabel={`${formatCm(cmOf(crop.w))} × ${formatCm(cmOf(crop.h))}`}
          finalLabel={`${formatScaled(cmOf(crop.w))} × ${formatScaled(cmOf(crop.h))}`}
          extra={<span>{Math.round(crop.w)} × {Math.round(crop.h)} px</span>}
        />
      )}
      modal={modalOpen && (
        <ImageSourceModal onClose={() => setModalOpen(false)} onSelect={(url) => { setImageUrl(url); setModalOpen(false) }} />
      )}
    />
  )
}
