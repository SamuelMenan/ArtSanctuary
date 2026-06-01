'use client'

import AppShell from '@frontend/shared/layouts/AppShell'
import ToolActiveLayout from '@frontend/features/tools/shared/ToolActiveLayout'
import ImageSourceModal from '@frontend/features/tools/shared/ImageSourceModal'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { setHandoff, takeHandoff } from '@shared/lib/tools/handoff'
import { applyScale, formatCm, formatScaled } from '@shared/lib/measure'

// Etiqueta de columna estilo hoja de cálculo: 0->A, 25->Z, 26->AA…
function colLabel(n: number): string {
  let s = ''
  n += 1
  while (n > 0) {
    const r = (n - 1) % 26
    s = String.fromCharCode(65 + r) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

const CM_PRESETS = [1.5, 28] as const

export default function ReferenceGridScreen() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imgNatural, setImgNatural] = useState({ w: 4, h: 3 })

  const [realWidthCm, setRealWidthCm] = useState(15)
  const [squareCm, setSquareCm] = useState(1.5)

  const [opacity, setOpacity] = useState(30)
  const [color, setColor] = useState('#ffffff')
  const [showNumbers, setShowNumbers] = useState(false)

  // Cargar preferencias guardadas
  useEffect(() => {
    try {
      const saved = localStorage.getItem('grid-prefs')
      if (saved) {
        const p = JSON.parse(saved)
        if (p.opacity !== undefined) setOpacity(p.opacity)
        if (p.color !== undefined) setColor(p.color)
        if (p.showNumbers !== undefined) setShowNumbers(p.showNumbers)
        if (p.squareCm !== undefined) {
          setSquareCm(p.squareCm)
          setRealWidthCm((w) => Math.max(p.squareCm, Math.round(w / p.squareCm) * p.squareCm))
        }
      }
    } catch {}
  }, [])

  // Guardar preferencias
  useEffect(() => {
    localStorage.setItem('grid-prefs', JSON.stringify({ opacity, color, showNumbers, squareCm }))
  }, [opacity, color, showNumbers, squareCm])

  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)

  const prevColor = useRef(color)
  const prevOpacity = useRef(opacity)

  // Historial
  type GridSnapshot = {
    realWidthCm: number; squareCm: number;
    opacity: number; color: string; showNumbers: boolean;
    pan: { x: number; y: number }; zoom: number;
  }
  const currentState = useRef<GridSnapshot>({ realWidthCm, squareCm, opacity, color, showNumbers, pan, zoom })
  currentState.current = { realWidthCm, squareCm, opacity, color, showNumbers, pan, zoom }
  
  const pastData = useRef<GridSnapshot[]>([])
  const futureData = useRef<GridSnapshot[]>([])
  const [historyTick, setHistoryTick] = useState(0)

  const pushSnapshot = (override?: Partial<GridSnapshot>) => {
    pastData.current.push({ ...currentState.current, ...override })
    if (pastData.current.length > 20) pastData.current.shift()
    futureData.current = []
    setHistoryTick(t => t + 1)
  }

  const applyState = (s: GridSnapshot) => {
    setRealWidthCm(s.realWidthCm)
    setSquareCm(s.squareCm)
    setOpacity(s.opacity)
    setColor(s.color)
    setShowNumbers(s.showNumbers)
    setPan(s.pan)
    setZoom(s.zoom)
  }

  const undo = () => {
    if (pastData.current.length === 0) return
    futureData.current.push(currentState.current)
    applyState(pastData.current.pop()!)
    setHistoryTick(t => t + 1)
  }

  const redo = () => {
    if (futureData.current.length === 0) return
    pastData.current.push(currentState.current)
    applyState(futureData.current.pop()!)
    setHistoryTick(t => t + 1)
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT') return
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

  const [modalOpen, setModalOpen] = useState(false)
  const [exportWarning, setExportWarning] = useState<string | null>(null)

  const router = useRouter()
  const stageRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const dragging = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null)
  const [sending, setSending] = useState(false)
  // Destino de retorno si llegamos desde un board (round-trip).
  const back = useRef<{ boardId?: string; objectId?: string } | null>(null)

  // Handoff entrante (?handoff=1): carga imagen + calibración de otra herramienta.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('handoff') !== '1') return
    window.history.replaceState(null, '', '/dashboard/tools/grid')
    const p = takeHandoff()
    if (!p) return
    if (p.source === 'boards') back.current = { boardId: p.boardId, objectId: p.objectId }
    /* eslint-disable react-hooks/set-state-in-effect */
    setImageUrl(p.imageUrl)
    if (p.squareCm) setSquareCm(p.squareCm)
    if (p.widthCm) setRealWidthCm(Math.max(1, Math.round(p.widthCm)))
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  // Tamaño disponible del escenario (excluye padding gracias a contentRect)
  const [stage, setStage] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect
      setStage({ w: cr.width, h: cr.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ── Geometría de la cuadrícula ──
  // El ancho real debe ser múltiplo del cuadro: cols es entero exacto y la
  // proporción cols:rows se mantiene para escalar el mismo dibujo más grande.
  const aspect = imgNatural.h / imgNatural.w
  const cols = Math.max(1, Math.round(realWidthCm / squareCm))
  const effWidthCm = cols * squareCm // ancho efectivo, ya múltiplo del cuadro
  const realHeightCm = Math.max(1, effWidthCm * aspect)
  const rows = Math.max(1, Math.round(realHeightCm / squareCm))
  
  const targetCm = applyScale(squareCm)
  const factor = targetCm / squareCm
  const canvasW = Math.round(cols * targetCm)
  const canvasH = Math.round(rows * targetCm)

  // Tamaño REAL del lienzo en px: encaja cols:rows dentro del escenario.
  // Garantiza celdas perfectamente cuadradas = idéntico al PNG exportado.
  const fit = Math.min((Math.min(stage.w, 920) || 0) / cols, (stage.h || 0) / rows)
  const frameW = fit > 0 ? cols * fit : 0
  const frameH = fit > 0 ? rows * fit : 0

  // Calculadora de tamaño: ancho/alto = nº cuadros × tamaño cuadro
  const refW = cols * squareCm
  const refH = rows * squareCm
  // Use shared formatting helpers: referencia = solo cm; final = cm + (m) cuando aplica

  const alphaHex = Math.round(opacity * 2.55).toString(16).padStart(2, '0')
  const gridStyle = {
    backgroundImage: `linear-gradient(to right, ${color}${alphaHex} 1px, transparent 1px),
                      linear-gradient(to bottom, ${color}${alphaHex} 1px, transparent 1px)`,
    backgroundSize: `${100 / cols}% ${100 / rows}%`,
  }

  // ── Pan + zoom ──
  const onPointerDown = (e: React.PointerEvent) => {
    if (!imageUrl) return
    pushSnapshot()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    dragging.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return
    setPan({
      x: dragging.current.panX + (e.clientX - dragging.current.startX),
      y: dragging.current.panY + (e.clientY - dragging.current.startY),
    })
  }
  const onPointerUp = () => {
    dragging.current = null
  }
  const wheeling = useRef(false)
  const onWheel = (e: React.WheelEvent) => {
    if (!imageUrl) return
    e.preventDefault() // prevent page scroll
    if (!wheeling.current) {
      pushSnapshot()
      wheeling.current = true
    }
    const delta = e.deltaY * -0.001
    const nextZoom = Math.min(Math.max(0.1, zoom * (1 + delta)), 5)
    
    // Zoom toward pointer
    const f = frameRef.current
    if (f) {
      const rect = f.getBoundingClientRect()
      const px = e.clientX - rect.left - rect.width / 2
      const py = e.clientY - rect.top - rect.height / 2
      // offset shift to keep pointer stationary
      const scaleChange = nextZoom - zoom
      setPan((p) => ({
        x: p.x - (px * scaleChange) / zoom,
        y: p.y - (py * scaleChange) / zoom,
      }))
    }
    setZoom(nextZoom)
    
    clearTimeout((onWheel as any).t)
    ;(onWheel as any).t = setTimeout(() => { wheeling.current = false }, 500)
  }

  const resetView = () => {
    pushSnapshot()
    setPan({ x: 0, y: 0 })
    setZoom(1)
  }

  // Ancho siempre múltiplo del cuadro
  const snapMul = (cm: number) => Math.max(squareCm, Math.round(cm / squareCm) * squareCm)
  // Re-ajusta ancho cuando cambia el tamaño del cuadro
  useEffect(() => {
    setRealWidthCm((w) => Math.max(squareCm, Math.round(w / squareCm) * squareCm))
  }, [squareCm])

  // ── Generador de Blob (Cuadrícula Renderizada) ──
  const generateGridBlob = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!imageUrl || !frameRef.current) return reject(new Error('No image'))
      const fr = frameRef.current.getBoundingClientRect()
      const cellPx = 120
      const EW = cols * cellPx
      const EH = rows * cellPx
      const k = EW / fr.width // factor pantalla -> export

      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = EW
        canvas.height = EH
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('No ctx'))

        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, EW, EH)

        // Imagen con el mismo contain + pan/zoom que en pantalla
        const containScale = Math.min(EW / img.naturalWidth, EH / img.naturalHeight)
        const dw = img.naturalWidth * containScale * zoom
        const dh = img.naturalHeight * containScale * zoom
        const dx = EW / 2 + pan.x * k - dw / 2
        const dy = EH / 2 + pan.y * k - dh / 2
        ctx.drawImage(img, dx, dy, dw, dh)

        ctx.strokeStyle = color
        ctx.globalAlpha = opacity / 100
        ctx.lineWidth = 1
        for (let c = 0; c <= cols; c++) {
          const x = Math.round((c * EW) / cols) + 0.5
          ctx.beginPath()
          ctx.moveTo(x, 0)
          ctx.lineTo(x, EH)
          ctx.stroke()
        }
        for (let r = 0; r <= rows; r++) {
          const y = Math.round((r * EH) / rows) + 0.5
          ctx.beginPath()
          ctx.moveTo(0, y)
          ctx.lineTo(EW, y)
          ctx.stroke()
        }
        ctx.globalAlpha = 1

        if (showNumbers) {
          ctx.fillStyle = color
          ctx.globalAlpha = Math.min(1, opacity / 100 + 0.3)
          ctx.font = `${Math.round(cellPx / 6)}px monospace`
          ctx.textBaseline = 'top'
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              ctx.fillText(`${colLabel(c)}${r + 1}`, (c * EW) / cols + 4, (r * EH) / rows + 4)
            }
          }
          ctx.globalAlpha = 1
        }

        try {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob)
            else reject(new Error('Blob failed'))
          }, 'image/png')
        } catch (e) {
          reject(e)
        }
      }
      img.onerror = () => reject(new Error('Image load failed'))
      img.src = imageUrl
    })
  }

  // ── Exportar PNG ──
  const exportPNG = async () => {
    setExportWarning(null)
    try {
      const blob = await generateGridBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'grid.png'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setExportWarning('No se pudo exportar (imagen externa sin permiso CORS).')
    }
  }

  // Enviar a Boards conservando el tamaño real (refW × refH cm = cols × rows cuadros).
  const sendToBoards = async () => {
    if (!imageUrl) return
    setSending(true)
    setExportWarning(null)
    try {
      const blob = await generateGridBlob()
      
      // Subir la imagen renderizada (con la cuadrícula quemada)
      const fd = new FormData()
      fd.append('file', new File([blob], 'grid.png', { type: 'image/png' }))
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!uploadRes.ok) throw new Error('Upload failed')
      const { imageUrl: newImageUrl } = await uploadRes.json()
      // Exportar al board usando las dimensiones finales
      const finW = applyScale(refW)
      const finH = applyScale(refH)
      const payload = { imageUrl: newImageUrl, widthCm: refW, heightCm: refH, widthScaledCm: finW, heightScaledCm: finH, squareCm, source: 'grid' as const }
      if (back.current?.boardId) {
        setHandoff({ ...payload, boardId: back.current.boardId, objectId: back.current.objectId })
        router.push(`/dashboard/boards/${back.current.boardId}?handoff=1`)
      } else {
        setHandoff(payload)
        router.push('/dashboard/boards')
      }
    } catch {
      setExportWarning('No se pudo enviar a Boards.')
      setSending(false)
    }
  }

  // ── Estilos reutilizables ──
  const lbl = 'font-mono text-[10px] text-[var(--color-on-surface-variant)] uppercase tracking-[0.08em]'
  const numInput =
    'w-12 bg-transparent border-0 border-b border-[var(--color-outline-variant)] px-0.5 py-0.5 font-mono text-[var(--text-label-sm)] text-[var(--color-primary)] text-center focus:border-[var(--color-primary)] outline-none'

  // Cluster: agrupa controles relacionados en un contenedor con etiqueta
  const Cluster = ({ name, children }: { name: string; children: React.ReactNode }) => (
    <div className="flex items-center gap-3 px-3 h-10 rounded-lg bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/60 shrink-0">
      <span className="font-mono text-[9px] text-[var(--color-on-surface-variant)]/70 uppercase tracking-[0.12em] hidden xl:inline">{name}</span>
      {children}
    </div>
  )

  return (
    <AppShell>
      <ToolActiveLayout>
        <div className="bg-[var(--color-surface-container)] border-b border-[var(--color-outline-variant)] shrink-0 px-[var(--spacing-grid-gutter)] py-2.5 flex items-center gap-3 overflow-x-auto whitespace-nowrap">
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

          <span className="w-px h-6 bg-[var(--color-outline-variant)]/60" />

          {/* Medidas */}
          <Cluster name="Medidas">
            <label className="flex items-center gap-1">
              <span className={lbl}>Ancho</span>
              <button
                type="button"
                onClick={() => { pushSnapshot(); setRealWidthCm((w) => snapMul(w - squareCm)); }}
                className="material-symbols-outlined text-[16px] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] leading-none"
                aria-label="Menos un cuadro"
              >remove</button>
              <input
                type="number" min={squareCm} step={squareCm} value={realWidthCm}
                onFocus={() => pushSnapshot()}
                onChange={(e) => setRealWidthCm(Number(e.target.value))}
                onBlur={(e) => setRealWidthCm(snapMul(Number(e.target.value)))}
                className={numInput}
              />
              <button
                type="button"
                onClick={() => { pushSnapshot(); setRealWidthCm((w) => snapMul(w + squareCm)); }}
                className="material-symbols-outlined text-[16px] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] leading-none"
                aria-label="Más un cuadro"
              >add</button>
              <span className={lbl}>cm</span>
            </label>
            <span className="w-px h-4 bg-[var(--color-outline-variant)]/60" />
            <label className="flex items-center gap-1.5">
              <span className={lbl}>Cuadro</span>
              <input type="number" min={0.1} step={0.5} value={squareCm} onFocus={() => pushSnapshot()} onChange={(e) => setSquareCm(Math.max(0.1, Number(e.target.value)))} className={numInput} />
              <div className="flex items-center gap-1">
                {CM_PRESETS.map((preset) => {
                  const active = Math.abs(squareCm - preset) < 0.01
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => { pushSnapshot(); setSquareCm(preset) }}
                      title={`Usar ${preset} cm`}
                      className={`h-8 px-2 rounded-md border text-[10px] font-semibold transition-colors ${active ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'}`}
                    >
                      {preset} cm
                    </button>
                  )
                })}
              </div>
              <span className={lbl}>cm</span>
            </label>
          </Cluster>

          {/* Estilo */}
          <Cluster name="Estilo">
            <span className="material-symbols-outlined text-[16px] text-[var(--color-on-surface-variant)]">opacity</span>
            <input className="w-20 custom-range" max="100" min="0" type="range" value={opacity} 
              onPointerDown={() => { prevOpacity.current = opacity }} 
              onPointerUp={() => { if (opacity !== prevOpacity.current) pushSnapshot({ opacity: prevOpacity.current }) }} 
              onChange={(e) => setOpacity(Number(e.target.value))} 
            />
            <span className="font-mono text-[10px] text-[var(--color-primary)] w-7 text-right">{opacity}%</span>
            <span className="w-px h-4 bg-[var(--color-outline-variant)]/60" />
            <div className="w-5 h-5 rounded-sm border border-[var(--color-outline-variant)] hover:border-[var(--color-primary)] transition-colors relative overflow-hidden">
              <input type="color" value={color} 
                onFocus={() => { prevColor.current = color }} 
                onBlur={() => { if (color !== prevColor.current) pushSnapshot({ color: prevColor.current }) }} 
                onChange={(e) => setColor(e.target.value)} 
                className="absolute inset-[-10px] w-10 h-10 cursor-pointer" 
              />
            </div>
            <span className="w-px h-4 bg-[var(--color-outline-variant)]/60" />
            <button
              onClick={() => { pushSnapshot(); setShowNumbers((v) => !v); }}
              aria-pressed={showNumbers}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md font-mono text-[10px] uppercase tracking-[0.08em] transition-colors ${
                showNumbers ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">tag</span>
              Numerar
            </button>
          </Cluster>

          <div className="flex-1" />

          {/* Acciones */}
          <button
            onClick={resetView}
            disabled={!imageUrl}
            className="flex items-center justify-center w-10 h-10 rounded-lg border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors shrink-0 disabled:opacity-40"
            title="Centrar imagen"
          >
            <span className="material-symbols-outlined text-[20px]">recenter</span>
          </button>
          <button
            onClick={sendToBoards}
            disabled={!imageUrl || sending}
            className={`flex items-center gap-2 h-10 px-4 rounded-lg border border-[var(--color-outline)] font-mono text-[var(--text-label-sm)] font-semibold shrink-0 disabled:opacity-40 hover:opacity-90 transition-opacity ${
              back.current?.boardId
                ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                : 'bg-[var(--color-surface-container-high)] text-[var(--color-primary)]'
            }`}
            title={back.current?.boardId ? 'Volver al board con esta medida' : 'Enviar a Boards (respeta el tamaño)'}
          >
            <span className="material-symbols-outlined text-[18px]">{back.current?.boardId ? 'undo' : 'dashboard'}</span>
            {back.current?.boardId ? 'BOARD' : 'BOARDS'}
          </button>
          <button
            onClick={exportPNG}
            disabled={!imageUrl}
            className="flex items-center gap-2 h-10 px-4 rounded-lg bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] border border-[var(--color-outline)] shadow-[0_1px_0_var(--color-outline)] font-mono text-[var(--text-label-sm)] font-semibold shrink-0 disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            EXPORTAR
          </button>
        </div>

        {/* Escenario (lienzo) */}
        <div ref={stageRef} className="flex-1 bg-[var(--color-surface-container-lowest)] p-[var(--spacing-grid-gutter)] flex items-center justify-center relative min-h-0 overflow-hidden">
          <div
            ref={frameRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onWheel={onWheel}
            className="relative border border-[var(--color-outline-variant)] shadow-2xl bg-[var(--color-surface)] overflow-hidden select-none touch-none transition-[width,height] duration-200 ease-out"
            style={{ width: frameW || undefined, height: frameH || undefined, aspectRatio: `${cols} / ${rows}`, cursor: imageUrl ? 'grab' : 'default' }}
          >
            {imageUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Referencia"
                  src={imageUrl}
                  draggable={false}
                  onLoad={(e) => {
                    const t = e.currentTarget
                    setImgNatural({ w: t.naturalWidth, h: t.naturalHeight })
                    // Auto-calcula el ancho real desde los px naturales (96dpi ≈ 37.8 px/cm),
                    // limitado a un rango sensato y ajustado a múltiplo del cuadro. Editable.
                    const cmFromPx = t.naturalWidth / 37.795
                    setRealWidthCm(snapMul(Math.min(200, Math.max(squareCm * 2, cmFromPx))))
                  }}
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'center' }}
                />
                <div className="absolute inset-0 pointer-events-none" style={gridStyle} />
                {showNumbers && (
                  <div
                    className="absolute inset-0 grid pointer-events-none"
                    style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}
                  >
                    {Array.from({ length: cols * rows }).map((_, i) => {
                      const c = i % cols
                      const r = Math.floor(i / cols)
                      return (
                        <span key={i} className="font-mono leading-none p-0.5 text-[9px]" style={{ color, opacity: Math.min(1, opacity / 100 + 0.3) }}>
                          {colLabel(c)}{r + 1}
                        </span>
                      )
                    })}
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={() => setModalOpen(true)}
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors"
              >
                <span className="material-symbols-outlined text-5xl">add_photo_alternate</span>
                <span className="font-mono text-[var(--text-label-sm)] uppercase tracking-widest">Sube o elige una imagen</span>
              </button>
            )}
          </div>
        </div>

        {/* Pie: métricas + calculadora */}
        <div className="bg-[var(--color-surface-container)] border-t border-[var(--color-outline-variant)] shrink-0 px-[var(--spacing-grid-gutter)] py-2 flex items-center justify-between gap-4 overflow-x-auto whitespace-nowrap">
          <div className="font-mono text-[var(--text-label-sm)] text-[var(--color-on-surface-variant)] flex items-center gap-3">
            <span className="text-[var(--color-primary)]">{cols} × {rows} cuadros</span>
            <span className="opacity-40">·</span>
            <span>{squareCm}cm → {targetCm}cm (×{Number.isInteger(factor) ? factor : factor.toFixed(1)})</span>
            <span className="opacity-40">·</span>
            <span>lienzo {canvasW}×{canvasH} cm</span>
            {imageUrl && <><span className="opacity-40">·</span><span>zoom {Math.round(zoom * 100)}%</span></>}
          </div>

          <div className="flex items-stretch gap-3 font-mono text-[10px] shrink-0">
            <div className="flex flex-col justify-center px-3 py-1 rounded-md bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/60">
              <span className="text-[var(--color-on-surface-variant)] uppercase tracking-[0.1em] mb-0.5">Referencia · {squareCm}cm</span>
              <span className="text-[var(--color-on-surface)]">A {formatCm(refW)} · Al {formatCm(refH)}</span>
            </div>
            <div className="flex flex-col justify-center px-3 py-1 rounded-md bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/40">
              <span className="text-[var(--color-primary)] uppercase tracking-[0.1em] mb-0.5">Final · {formatScaled(squareCm)}</span>
              <span className="text-[var(--color-primary)]">A {formatScaled(refW)} · Al {formatScaled(refH)}</span>
            </div>
          </div>
        </div>

        {exportWarning && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 font-sans text-xs text-red-500 bg-red-500/10 border border-red-500/30 rounded-sm px-3 py-1.5 z-30">
            {exportWarning}
          </div>
        )}

        {modalOpen && (
          <ImageSourceModal
            onClose={() => setModalOpen(false)}
            onSelect={(url) => {
              setImageUrl(url)
              setModalOpen(false)
              resetView()
              setExportWarning(null)
            }}
          />
        )}
      </ToolActiveLayout>
    </AppShell>
  )
}
