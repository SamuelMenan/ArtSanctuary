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
  const [wand, setWand] = useState(false)
  const [tolerance, setTolerance] = useState(30)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const work = useRef<HTMLCanvasElement | null>(null) // imagen de trabajo (full-res, con alfa)
  const displayRef = useRef<HTMLCanvasElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const back = useRef<{ boardId?: string; objectId?: string } | null>(null)
  const [stage, setStage] = useState({ w: 0, h: 0 })
  const [ready, setReady] = useState(false)

  // Handoff entrante (?handoff=1)
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
      const blob = await removeBackground(absoluteUrl)
      const url = URL.createObjectURL(blob)
      const img = await loadImage(url)
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

  // Varita mágica: click → borra fondo contiguo
  const onCanvasClick = (e: React.MouseEvent) => {
    if (!wand || !work.current) return
    const f = fit()
    const disp = displayRef.current
    if (!f || !disp) return
    const rect = disp.getBoundingClientRect()
    const ix = (e.clientX - rect.left - f.ox) / f.scale
    const iy = (e.clientY - rect.top - f.oy) / f.scale
    if (ix < 0 || iy < 0 || ix >= work.current.width || iy >= work.current.height) return
    const ctx = work.current.getContext('2d')!
    const data = ctx.getImageData(0, 0, work.current.width, work.current.height)
    floodErase(data, ix, iy, tolerance)
    ctx.putImageData(data, 0, 0)
    render()
  }

  // Sinergia: recorta el lienzo al sujeto (bounding box no transparente)
  const autoTrim = () => {
    const w = work.current
    if (!w) return
    const ctx = w.getContext('2d')!
    const data = ctx.getImageData(0, 0, w.width, w.height)
    const b = computeContentBounds(data, 18)
    if (!b) return
    work.current = cropCanvas(w, b)
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
  const sendTo = async (dest: 'boards' | 'cuadricula' | 'back') => {
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

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      {/* Controles */}
      <div className="bg-[var(--color-surface-container)] border-b border-[var(--color-outline-variant)] shrink-0 px-4 py-2.5 flex items-center gap-3 overflow-x-auto whitespace-nowrap">
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 h-10 px-4 rounded-lg bg-[var(--color-primary)] text-[var(--color-on-primary)] font-mono text-[var(--text-label-sm)] font-semibold shrink-0 hover:opacity-90">
          <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
          IMAGEN
        </button>

        {ready && (
          <>
            <span className="w-px h-6 bg-[var(--color-outline-variant)]/60" />
            <button onClick={removeBgAI} disabled={busy} className="flex items-center gap-2 h-10 px-4 rounded-lg bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] font-mono text-[var(--text-label-sm)] font-semibold shrink-0 hover:opacity-90 disabled:opacity-40">
              <span className="material-symbols-outlined text-[18px]">{busy ? 'hourglass_top' : 'auto_fix_high'}</span>
              QUITAR FONDO (IA)
            </button>
            <button onClick={() => setWand((v) => !v)} aria-pressed={wand} className={`${ctrlBtn} ${wand ? '!text-[var(--color-primary)] !border-[var(--color-primary)] bg-[var(--color-primary)]/10' : ''}`} title="Varita mágica (click en el fondo)">
              <span className="material-symbols-outlined text-[18px]">colorize</span>
              VARITA
            </button>
            <label className="flex items-center gap-1.5 shrink-0" title="Tolerancia de la varita">
              <span className="material-symbols-outlined text-[16px] text-[var(--color-on-surface-variant)]">tune</span>
              <input type="range" min={0} max={120} value={tolerance} onChange={(e) => setTolerance(Number(e.target.value))} className="w-20 custom-range" />
              <span className="font-mono text-[10px] text-[var(--color-primary)] w-6">{tolerance}</span>
            </label>
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
            <button onClick={() => sendTo('cuadricula')} disabled={busy} className={ctrlBtn} title="Enviar a Cuadrícula">
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
            onClick={onCanvasClick}
            className={`absolute inset-0 ${wand ? 'cursor-crosshair' : ''}`}
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
