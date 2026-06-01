'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadImage, imageToCanvas, cropCanvas, canvasToBlob, downloadBlob, uploadBlob } from '@shared/lib/image/canvas'
import { computeContentBounds } from '@shared/lib/image/autocrop'
import { floodErase } from '@shared/lib/image/floodfill'
import { setHandoff, takeHandoff } from '@shared/lib/tools/handoff'
import { cmOf, applyScale } from '@shared/lib/measure'

export type CutoutToolMode = 'wand' | 'erase' | 'restore' | null

/** Estado y lógica del recortador de fondo (canvas, historial, pincel, IA, handoff). */
export function useCutoutEditor() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [aiModel, setAiModel] = useState<'isnet' | 'isnet_fp16'>('isnet')
  const [aiRescale, setAiRescale] = useState(true)
  const [toolMode, setToolMode] = useState<CutoutToolMode>(null)
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
      const widthScaledCm = applyScale(widthCm)
      const heightScaledCm = applyScale(heightCm)
      if (dest === 'back' && back.current?.boardId) {
        setHandoff({ imageUrl: url, widthCm, heightCm, widthScaledCm, heightScaledCm, source: 'crop', boardId: back.current.boardId, objectId: back.current.objectId })
        router.push(`/dashboard/boards/${back.current.boardId}?handoff=1`)
      } else if (dest === 'grid') {
        setHandoff({ imageUrl: url, widthCm, heightCm, widthScaledCm, heightScaledCm, source: 'crop' })
        router.push('/dashboard/tools/grid?handoff=1')
      } else {
        setHandoff({ imageUrl: url, widthCm, heightCm, widthScaledCm, heightScaledCm, source: 'crop' })
        router.push('/dashboard/boards')
      }
    } catch {
      setError('No se pudo enviar.')
      setBusy(false)
    }
  }

  return {
    // estado UI
    modalOpen, setModalOpen,
    aiModel, setAiModel,
    aiRescale, setAiRescale,
    toolMode, setToolMode,
    tolerance, setTolerance,
    brushSize, setBrushSize,
    busy, status, error, ready,
    setImageUrl,
    // refs (lectura directa en UI, como el original)
    work, displayRef, stageRef, back,
    pastData, futureData, historyTick,
    // acciones
    undo, redo, removeBgAI, autoTrim, exportPng, sendTo,
    // eventos puntero
    onPointerDown, onPointerMove, onPointerUp,
  }
}

export type CutoutEditor = ReturnType<typeof useCutoutEditor>
