'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import ImageSourceModal from '@frontend/features/tools/shared/ImageSourceModal'
import { loadImage, imageToCanvas, cropCanvas, canvasToBlob, downloadBlob, uploadBlob } from '@/lib/image/canvas'
import { computeContentBounds, padBounds, type Bounds } from '@/lib/image/autocrop'
import { setHandoff, takeHandoff } from '@/lib/tools/handoff'
import { cmOf } from '@/lib/measure'

type DragMode = 'move' | 'nw' | 'ne' | 'sw' | 'se' | null

const ASPECTS: { label: string; value: number | null }[] = [
  { label: 'Libre', value: null },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:4', value: 3 / 4 },
  { label: '16:9', value: 16 / 9 },
]

export default function CropTool() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [crop, setCrop] = useState<Bounds>({ x: 0, y: 0, w: 0, h: 0 })
  const [tolerance, setTolerance] = useState(18)
  const [padding, setPadding] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const stageRef = useRef<HTMLDivElement>(null)
  const [stage, setStage] = useState({ w: 0, h: 0 })
  const drag = useRef<{ mode: DragMode; sx: number; sy: number; crop: Bounds } | null>(null)
  // Destino de retorno si llegamos desde un board (round-trip).
  const back = useRef<{ boardId?: string; objectId?: string } | null>(null)

  // Handoff entrante (?handoff=1): carga la imagen pasada por otra herramienta.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('handoff') !== '1') return
    window.history.replaceState(null, '', '/dashboard/tools/recorte')
    const p = takeHandoff()
    if (!p) return
    if (p.source === 'boards') back.current = { boardId: p.boardId, objectId: p.objectId }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setImageUrl(p.imageUrl)
  }, [])

  // Tamaño del escenario
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

  // Carga de imagen
  useEffect(() => {
    if (!imageUrl) return
    let active = true
    loadImage(imageUrl)
      .then((image) => {
        if (!active) return
        setImg(image)
        setCrop({ x: 0, y: 0, w: image.naturalWidth, h: image.naturalHeight })
        setError(null)
      })
      .catch(() => active && setError('No se pudo cargar la imagen'))
    return () => { active = false }
  }, [imageUrl])

  // Ajuste contain: imagen → pantalla
  const fit = useMemo(() => {
    if (!img || !stage.w) return { scale: 1, ox: 0, oy: 0, dw: 0, dh: 0 }
    const scale = Math.min(stage.w / img.naturalWidth, stage.h / img.naturalHeight)
    const dw = img.naturalWidth * scale
    const dh = img.naturalHeight * scale
    return { scale, ox: (stage.w - dw) / 2, oy: (stage.h - dh) / 2, dw, dh }
  }, [img, stage])

  // Crop en coords de pantalla
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

  const applyAspect = (ratio: number | null) => {
    if (!img || ratio === null) return
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
      if (!b) { setError('La imagen no tiene contenido recortable.'); return }
      setError(null)
      setCrop(padding ? padBounds(b, padding, canvas.width, canvas.height) : b)
    } catch {
      setError('No se pudo analizar la imagen (CORS).')
    }
  }

  const exportPng = async () => {
    if (!img) return
    setBusy(true)
    try {
      const out = cropCanvas(img, crop)
      const blob = await canvasToBlob(out, 'image/png')
      downloadBlob(blob, 'recorte.png')
    } catch {
      setError('No se pudo exportar.')
    } finally {
      setBusy(false)
    }
  }

  const reset = () => img && setCrop({ x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight })

  // Enviar el recorte a otra herramienta conservando el tamaño (cm).
  const sendTo = async (dest: 'boards' | 'cuadricula' | 'back') => {
    if (!img) return
    setBusy(true)
    setError(null)
    try {
      const blob = await canvasToBlob(cropCanvas(img, crop), 'image/png')
      const url = await uploadBlob(blob, 'recorte.png')
      const widthCm = cmOf(crop.w)
      const heightCm = cmOf(crop.h)
      if (dest === 'back' && back.current?.boardId) {
        setHandoff({ imageUrl: url, widthCm, heightCm, source: 'recorte', boardId: back.current.boardId, objectId: back.current.objectId })
        router.push(`/dashboard/boards/${back.current.boardId}?handoff=1`)
      } else if (dest === 'cuadricula') {
        setHandoff({ imageUrl: url, widthCm, heightCm, source: 'recorte' })
        router.push('/dashboard/tools/cuadricula?handoff=1')
      } else {
        const res = await fetch('/api/boards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Desde recorte' }) })
        if (!res.ok) throw new Error()
        const { board } = await res.json()
        setHandoff({ imageUrl: url, widthCm, heightCm, source: 'recorte' })
        router.push(`/dashboard/boards/${board._id}?handoff=1`)
      }
    } catch {
      setError('No se pudo enviar.')
      setBusy(false)
    }
  }

  const ctrlBtn =
    'flex items-center gap-2 h-10 px-3 rounded-lg border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors shrink-0 disabled:opacity-40 font-mono text-[var(--text-label-sm)]'
  const handle =
    'absolute w-3 h-3 bg-[var(--color-primary)] border border-white rounded-sm'

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      {/* Controles */}
      <div className="bg-[var(--color-surface-container)] border-b border-[var(--color-outline-variant)] shrink-0 px-4 py-2.5 flex items-center gap-3 overflow-x-auto whitespace-nowrap">
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 h-10 px-4 rounded-lg bg-[var(--color-primary)] text-[var(--color-on-primary)] font-mono text-[var(--text-label-sm)] font-semibold shrink-0 hover:opacity-90">
          <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
          IMAGEN
        </button>

        {img && (
          <>
            <span className="w-px h-6 bg-[var(--color-outline-variant)]/60" />
            <select
              onChange={(e) => applyAspect(ASPECTS[Number(e.target.value)].value)}
              className="h-10 px-2 rounded-lg bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)] font-mono text-[var(--text-label-sm)] text-[var(--color-on-surface)] outline-none"
              title="Proporción"
              defaultValue={0}
            >
              {ASPECTS.map((a, i) => <option key={a.label} value={i}>{a.label}</option>)}
            </select>

            <button onClick={autoCrop} className={ctrlBtn} title="Recorte automático">
              <span className="material-symbols-outlined text-[18px]">crop_free</span>
              AUTO
            </button>
            <label className="flex items-center gap-1.5 shrink-0" title="Tolerancia del auto-crop (imágenes sin transparencia)">
              <span className="material-symbols-outlined text-[16px] text-[var(--color-on-surface-variant)]">tune</span>
              <input type="range" min={0} max={60} value={tolerance} onChange={(e) => setTolerance(Number(e.target.value))} className="w-20 custom-range" />
              <span className="font-mono text-[10px] text-[var(--color-primary)] w-5">{tolerance}</span>
            </label>
            <label className="flex items-center gap-1 shrink-0" title="Margen al recortar (px)">
              <span className="font-mono text-[10px] uppercase text-[var(--color-on-surface-variant)]">Pad</span>
              <input type="number" min={0} value={padding} onChange={(e) => setPadding(Math.max(0, Number(e.target.value) || 0))} className="w-14 h-9 bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)] rounded-md px-2 font-mono text-sm text-center text-[var(--color-on-surface)] outline-none" />
            </label>

            <button onClick={reset} className={ctrlBtn} title="Restablecer">
              <span className="material-symbols-outlined text-[18px]">restart_alt</span>
            </button>

            <div className="flex-1" />
            <span className="font-mono text-[10px] text-[var(--color-on-surface-variant)] shrink-0">{Math.round(crop.w)} × {Math.round(crop.h)} px</span>
            {back.current?.boardId ? (
              <button onClick={() => sendTo('back')} disabled={busy} className={`${ctrlBtn} !text-[var(--color-primary)] !border-[var(--color-primary)]`} title="Volver al board">
                <span className="material-symbols-outlined text-[18px]">undo</span>
                BOARD
              </button>
            ) : (
              <button onClick={() => sendTo('boards')} disabled={busy} className={ctrlBtn} title="Enviar a Boards">
                <span className="material-symbols-outlined text-[18px]">dashboard</span>
                BOARDS
              </button>
            )}
            <button onClick={() => sendTo('cuadricula')} disabled={busy} className={ctrlBtn} title="Enviar a Cuadrícula">
              <span className="material-symbols-outlined text-[18px]">grid_on</span>
            </button>
            <button onClick={exportPng} disabled={busy} className="flex items-center gap-2 h-10 px-4 rounded-lg bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] font-mono text-[var(--text-label-sm)] font-semibold shrink-0 hover:opacity-90 disabled:opacity-40">
              <span className="material-symbols-outlined text-[18px]">download</span>
              EXPORTAR
            </button>
          </>
        )}
      </div>

      {/* Escenario */}
      <div
        ref={stageRef}
        className="flex-1 bg-[var(--color-surface-container-lowest)] min-h-0 overflow-hidden relative select-none touch-none"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {img ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl!} alt="" draggable={false} className="absolute pointer-events-none" style={{ left: fit.ox, top: fit.oy, width: fit.dw, height: fit.dh }} />
            {/* Velo oscuro fuera del recorte (box-shadow gigante, recortado por overflow) */}
            <div className="absolute pointer-events-none" style={{ left: screen.left, top: screen.top, width: screen.width, height: screen.height, boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }} />
            {/* Rectángulo de recorte */}
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
          </>
        ) : (
          <button onClick={() => setModalOpen(true)} className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors">
            <span className="material-symbols-outlined text-5xl">crop</span>
            <span className="font-mono text-[var(--text-label-sm)] uppercase tracking-widest">Sube o elige una imagen para recortar</span>
          </button>
        )}

        {error && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 font-sans text-xs text-red-500 bg-red-500/10 border border-red-500/30 rounded px-3 py-1.5 z-30">{error}</div>
        )}
      </div>

      {modalOpen && (
        <ImageSourceModal onClose={() => setModalOpen(false)} onSelect={(url) => { setImageUrl(url); setModalOpen(false) }} />
      )}
    </div>
  )
}
