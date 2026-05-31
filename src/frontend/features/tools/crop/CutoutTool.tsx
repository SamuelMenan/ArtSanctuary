'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import ImageSourceModal from '@frontend/features/tools/shared/ImageSourceModal'
import { loadImage, imageToCanvas, cropCanvas, canvasToBlob, downloadBlob, uploadBlob } from '@shared/lib/image/canvas'
import { computeContentBounds } from '@shared/lib/image/autocrop'
import { floodErase } from '@shared/lib/image/floodfill'
import { setHandoff, takeHandoff } from '@shared/lib/tools/handoff'
import { cmOf } from '@shared/lib/measure'

export default function CutoutTool() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [aiModel, setAiModel] = useState<'isnet' | 'isnet_fp16'>('isnet')
  const [aiRescale, setAiRescale] = useState(true)
  const [toolMode, setToolMode] = useState<'wand' | 'erase' | 'restore' | null>(null)
  const [tolerance, setTolerance] = useState(30)
  const [brushSize, setBrushSize] = useState(40)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const work = useRef<HTMLCanvasElement | null>(null) // imagen de trabajo (full-res, con alfa)
  const original = useRef<HTMLCanvasElement | null>(null) // copia intacta para restaurar
  const displayRef = useRef<HTMLCanvasElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const back = useRef<{ boardId?: string; objectId?: string } | null>(null)
  const [stage, setStage] = useState({ w: 0, h: 0 })
  const [ready, setReady] = useState(false)

  // Pincel
  const dragging = useRef(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  // Historial
  const pastData = useRef<ImageData[]>([])
  const futureData = useRef<ImageData[]>([])
  // Forzar re-render de botones si cambian las pilas
  const [historyTick, setHistoryTick] = useState(0)

  const pushSnapshot = () => {
    const w = work.current
    if (!w) return
    const ctx = w.getContext('2d')
    if (!ctx) return
    pastData.current.push(ctx.getImageData(0, 0, w.width, w.height))
    if (pastData.current.length > 20) pastData.current.shift()
    futureData.current = []
    setHistoryTick((t) => t + 1)
  }

  const undo = () => {
    const w = work.current
    if (!w || pastData.current.length === 0) return
    const ctx = w.getContext('2d')
    if (!ctx) return
    futureData.current.push(ctx.getImageData(0, 0, w.width, w.height))
    const past = pastData.current.pop()!
    w.width = past.width
    w.height = past.height
    ctx.putImageData(past, 0, 0)
    setHistoryTick((t) => t + 1)
    render()
  }

  const redo = () => {
    const w = work.current
    if (!w || futureData.current.length === 0) return
    const ctx = w.getContext('2d')
    if (!ctx) return
    pastData.current.push(ctx.getImageData(0, 0, w.width, w.height))
    const future = futureData.current.pop()!
    w.width = future.width
    w.height = future.height
    ctx.putImageData(future, 0, 0)
    setHistoryTick((t) => t + 1)
    render()
  }

  // Atajos teclado
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handoff entrante (?handoff=1)
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

  // Fit de la imagen de trabajo al escenario
  const fit = () => {
    const w = work.current
    if (!w || !stage.w) return null
    const scale = Math.min(stage.w / w.width, stage.h / w.height)
    const dw = w.width * scale
    const dh = w.height * scale
    return { scale, ox: (stage.w - dw) / 2, oy: (stage.h - dh) / 2, dw, dh }
  }

  const render = () => {
    const disp = displayRef.current
    const w = work.current
    if (!disp || !w) return
    disp.width = stage.w
    disp.height = stage.h
    const ctx = disp.getContext('2d')!
    ctx.clearRect(0, 0, disp.width, disp.height)
    const f = fit()
    if (f) ctx.drawImage(w, f.ox, f.oy, f.dw, f.dh)
  }

  useEffect(render, [stage, ready]) // eslint-disable-line react-hooks/exhaustive-deps

  // Carga inicial (tras declarar render)
  useEffect(() => {
    if (!imageUrl) return
    let active = true
    loadImage(imageUrl)
      .then((img) => {
        if (!active) return
        work.current = imageToCanvas(img)
        original.current = imageToCanvas(img)
        setError(null)
        setStatus(null)
        setReady(true)
        render()
      })
      .catch(() => active && setError('No se pudo cargar la imagen'))
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl])

  // Quitar fondo con IA (carga perezosa del modelo)
  const removeBgAI = async () => {
    if (!imageUrl) return
    setBusy(true)
    setError(null)
    setStatus('Cargando modelo…')
    try {
      const { removeBackground } = await import('@imgly/background-removal')
      setStatus('Procesando…')
      const absoluteUrl = new URL(imageUrl, window.location.href).href
      const blob = await removeBackground(absoluteUrl, {
        model: aiModel,
        rescale: aiRescale,
      })
      const url = URL.createObjectURL(blob)
      const img = await loadImage(url)
      pushSnapshot()
      work.current = imageToCanvas(img)
      URL.revokeObjectURL(url)
      render()
      setStatus('Fondo eliminado')
    } catch {
      setError('Falló el quitado de fondo IA.')
      setStatus(null)
    } finally {
      setBusy(false)
    }
  }

  // Herramientas de ratón
  const getPos = (e: React.PointerEvent) => {
    const f = fit()
    const disp = displayRef.current
    if (!f || !disp) return null
    const rect = disp.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left - f.ox) / f.scale,
      y: (e.clientY - rect.top - f.oy) / f.scale,
    }
  }

  const drawBrush = (x1: number, y1: number, x2: number, y2: number) => {
    if (!work.current) return
    const ctx = work.current.getContext('2d')!
    ctx.save()
    ctx.lineWidth = brushSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    if (toolMode === 'erase') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = 'rgba(0,0,0,1)'
    } else if (toolMode === 'restore' && original.current) {
      ctx.globalCompositeOperation = 'source-over'
      const pat = ctx.createPattern(original.current, 'no-repeat')
      ctx.strokeStyle = pat || '#000'
    }
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
    ctx.restore()
    render()
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (!toolMode || !work.current) return
    const p = getPos(e)
    if (!p) return

    if (toolMode === 'wand') {
      if (p.x < 0 || p.y < 0 || p.x >= work.current.width || p.y >= work.current.height) return
      pushSnapshot()
      const ctx = work.current.getContext('2d')!
      const data = ctx.getImageData(0, 0, work.current.width, work.current.height)
      floodErase(data, p.x, p.y, tolerance)
      ctx.putImageData(data, 0, 0)
      render()
      return
    }

    // Pincel
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    pushSnapshot()
    dragging.current = true
    lastPos.current = p
    drawBrush(p.x, p.y, p.x + 0.1, p.y + 0.1) // Dot
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || !lastPos.current) return
    const p = getPos(e)
    if (!p) return
    drawBrush(lastPos.current.x, lastPos.current.y, p.x, p.y)
    lastPos.current = p
  }

  const onPointerUp = () => {
    dragging.current = false
    lastPos.current = null
  }

  // Sinergia: recorta el lienzo al sujeto (bounding box no transparente)
  const autoTrim = () => {
    const w = work.current
    if (!w) return
    const ctx = w.getContext('2d')!
    const data = ctx.getImageData(0, 0, w.width, w.height)
    const b = computeContentBounds(data, 18)
    if (!b) return
    pushSnapshot()
    work.current = cropCanvas(w, b)
    if (original.current) original.current = cropCanvas(original.current, b)
    setStatus('Recortado al sujeto')
    render()
  }

  const exportPng = async () => {
    if (!work.current) return
    setBusy(true)
    try {
      const blob = await canvasToBlob(work.current, 'image/png')
      downloadBlob(blob, 'sin-fondo.png')
    } catch {
      setError('No se pudo exportar.')
    } finally {
      setBusy(false)
    }
  }

  // Enviar el resultado a otra herramienta conservando el tamaño (cm).
  const sendTo = async (dest: 'boards' | 'grid' | 'back') => {
    const w = work.current
    if (!w) return
    setBusy(true)
    setError(null)
    try {
      const blob = await canvasToBlob(w, 'image/png')
      const url = await uploadBlob(blob, 'sin-fondo.png')
      const widthCm = cmOf(w.width)
      const heightCm = cmOf(w.height)
      if (dest === 'back' && back.current?.boardId) {
        setHandoff({ imageUrl: url, widthCm, heightCm, source: 'crop', boardId: back.current.boardId, objectId: back.current.objectId })
        router.push(`/dashboard/boards/${back.current.boardId}?handoff=1`)
      } else if (dest === 'grid') {
        setHandoff({ imageUrl: url, widthCm, heightCm, source: 'crop' })
        router.push('/dashboard/tools/grid?handoff=1')
      } else {
        setHandoff({ imageUrl: url, widthCm, heightCm, source: 'crop' })
        router.push('/dashboard/boards')
      }
    } catch {
      setError('No se pudo enviar.')
      setBusy(false)
    }
  }

  const ctrlBtn =
    'flex items-center gap-2 h-10 px-3 rounded-lg border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors shrink-0 disabled:opacity-40 font-mono text-[var(--text-label-sm)]'

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      {/* Controles */}
      <div className="bg-[var(--color-surface-container)] border-b border-[var(--color-outline-variant)] shrink-0 px-4 py-2.5 flex items-center gap-3 overflow-x-auto whitespace-nowrap">
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 h-10 px-4 rounded-lg border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] font-mono text-[var(--text-label-sm)] font-semibold transition-colors">
            <span className="material-symbols-outlined text-[18px]">imagesmode</span>
            CAMBIAR FOTO
          </button>
          
          <span className="w-px h-6 bg-[var(--color-outline-variant)]/60" />

          <button onClick={undo} disabled={pastData.current.length === 0} className="flex items-center justify-center w-10 h-10 rounded-lg border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors shrink-0 disabled:opacity-40" title="Deshacer (Ctrl+Z)">
            <span className="material-symbols-outlined text-[20px]">undo</span>
          </button>
          <button onClick={redo} disabled={futureData.current.length === 0} className="flex items-center justify-center w-10 h-10 rounded-lg border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors shrink-0 disabled:opacity-40" title="Rehacer (Ctrl+Shift+Z)">
            <span className="material-symbols-outlined text-[20px]">redo</span>
          </button>
        {ready && (
          <>
            <span className="w-px h-6 bg-[var(--color-outline-variant)]/60" />
            <div className="flex items-center gap-2 bg-[var(--color-surface-container-low)] px-2 py-1 rounded border border-[var(--color-outline-variant)]/50">
              <span className="material-symbols-outlined text-[16px] text-[var(--color-on-surface-variant)]">memory</span>
              <select value={aiModel} onChange={(e) => setAiModel(e.target.value as any)} className="bg-transparent text-[var(--text-label-sm)] font-mono text-[var(--color-on-surface)] outline-none cursor-pointer">
                <option value="isnet">ISNet (Mejor)</option>
                <option value="isnet_fp16">ISNet FP16</option>
              </select>
              <label className="flex items-center gap-1.5 ml-2 cursor-pointer border-l border-[var(--color-outline-variant)]/50 pl-3">
                <input type="checkbox" checked={!aiRescale} onChange={(e) => setAiRescale(!e.target.checked)} className="accent-[var(--color-primary)] cursor-pointer" />
                <span className="font-mono text-[10px] uppercase text-[var(--color-on-surface-variant)]">Res. Original (Lento)</span>
              </label>
            </div>
            <button onClick={removeBgAI} disabled={busy} className="flex items-center gap-2 h-10 px-4 rounded-lg bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] font-mono text-[var(--text-label-sm)] font-semibold shrink-0 hover:opacity-90 disabled:opacity-40">
              <span className="material-symbols-outlined text-[18px]">{busy ? 'hourglass_top' : 'auto_fix_high'}</span>
              QUITAR FONDO (IA)
            </button>
            <span className="w-px h-6 bg-[var(--color-outline-variant)]/60" />

            <button onClick={() => setToolMode((v) => (v === 'wand' ? null : 'wand'))} className={`${ctrlBtn} ${toolMode === 'wand' ? '!text-[var(--color-primary)] !border-[var(--color-primary)] bg-[var(--color-primary)]/10' : ''}`} title="Varita mágica (click para borrar color similar)">
              <span className="material-symbols-outlined text-[18px]">colorize</span>
              VARITA
            </button>
            <button onClick={() => setToolMode((v) => (v === 'erase' ? null : 'erase'))} className={`${ctrlBtn} ${toolMode === 'erase' ? '!text-[var(--color-primary)] !border-[var(--color-primary)] bg-[var(--color-primary)]/10' : ''}`} title="Goma de borrar manual">
              <span className="material-symbols-outlined text-[18px]">ink_eraser</span>
              BORRAR
            </button>
            <button onClick={() => setToolMode((v) => (v === 'restore' ? null : 'restore'))} className={`${ctrlBtn} ${toolMode === 'restore' ? '!text-[var(--color-primary)] !border-[var(--color-primary)] bg-[var(--color-primary)]/10' : ''}`} title="Pincel para restaurar imagen original">
              <span className="material-symbols-outlined text-[18px]">brush</span>
              RESTAURAR
            </button>

            {toolMode === 'wand' && (
              <label className="flex items-center gap-1.5 shrink-0 bg-[var(--color-surface-container-low)] px-2 rounded border border-[var(--color-outline-variant)]/50" title="Tolerancia de la varita">
                <span className="material-symbols-outlined text-[16px] text-[var(--color-on-surface-variant)]">tune</span>
                <input type="range" min={0} max={120} value={tolerance} onChange={(e) => setTolerance(Number(e.target.value))} className="w-20 custom-range" />
                <span className="font-mono text-[10px] text-[var(--color-primary)] w-6">{tolerance}</span>
              </label>
            )}

            {(toolMode === 'erase' || toolMode === 'restore') && (
              <label className="flex items-center gap-1.5 shrink-0 bg-[var(--color-surface-container-low)] px-2 rounded border border-[var(--color-outline-variant)]/50" title="Tamaño del pincel">
                <span className="material-symbols-outlined text-[16px] text-[var(--color-on-surface-variant)]">line_weight</span>
                <input type="range" min={5} max={200} value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-20 custom-range" />
                <span className="font-mono text-[10px] text-[var(--color-primary)] w-6">{brushSize}px</span>
              </label>
            )}

            <span className="w-px h-6 bg-[var(--color-outline-variant)]/60" />
            <button onClick={autoTrim} className={ctrlBtn} title="Recortar al sujeto (quita el borde transparente)">
              <span className="material-symbols-outlined text-[18px]">crop_free</span>
              AJUSTAR
            </button>

            <div className="flex-1" />
            {status && <span className="font-mono text-[10px] text-[var(--color-on-surface-variant)] shrink-0">{status}</span>}
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
            <button onClick={() => sendTo('grid')} disabled={busy} className={ctrlBtn} title="Enviar a Cuadrícula">
              <span className="material-symbols-outlined text-[18px]">grid_on</span>
            </button>
            <button onClick={exportPng} disabled={busy} className="flex items-center gap-2 h-10 px-4 rounded-lg bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] font-mono text-[var(--text-label-sm)] font-semibold shrink-0 hover:opacity-90 disabled:opacity-40">
              <span className="material-symbols-outlined text-[18px]">download</span>
              EXPORTAR PNG
            </button>
          </>
        )}
      </div>

      {/* Escenario con damero (muestra transparencia) */}
      <div
        ref={stageRef}
        className="flex-1 min-h-0 overflow-hidden relative"
        style={{
          backgroundImage:
            'linear-gradient(45deg, #80808022 25%, transparent 25%), linear-gradient(-45deg, #80808022 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #80808022 75%), linear-gradient(-45deg, transparent 75%, #80808022 75%)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0',
          backgroundColor: 'var(--color-surface-container-lowest)',
        }}
      >
        {ready ? (
          <canvas
            ref={displayRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            className={`absolute inset-0 touch-none ${
              toolMode ? 'cursor-crosshair' : ''
            }`}
          />
        ) : (
          <button onClick={() => setModalOpen(true)} className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors">
            <span className="material-symbols-outlined text-5xl">auto_fix_high</span>
            <span className="font-mono text-[var(--text-label-sm)] uppercase tracking-widest">Sube o elige una imagen</span>
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
