'use client'

import AppShell from '@frontend/shared/layouts/AppShell'
import ToolActiveLayout from '@frontend/features/tools/shared/ToolActiveLayout'
import ImageSourceModal from '@frontend/features/tools/shared/ImageSourceModal'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { setHandoff, takeHandoff } from '@shared/lib/tools/handoff'
import { applyScale, formatCm, formatScaled } from '@shared/lib/measure'
import { colLabel } from '@frontend/features/tools/grid/lib/colLabel'
import { computeGridGeometry, snapToSquare } from '@frontend/features/tools/grid/lib/gridGeometry'
import { renderGridBlob } from '@frontend/features/tools/grid/lib/renderGridBlob'
import { useGridPrefs } from '@frontend/features/tools/grid/hooks/useGridPrefs'
import { useGridHistory } from '@frontend/features/tools/grid/hooks/useGridHistory'
import { useGridPanZoom } from '@frontend/features/tools/grid/hooks/useGridPanZoom'
import GridControls from '@frontend/features/tools/grid/components/GridControls'

export default function ReferenceGridScreen() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imgNatural, setImgNatural] = useState({ w: 4, h: 3 })

  const [realWidthCm, setRealWidthCm] = useState(15)
  const [squareCm, setSquareCm] = useState(1.5)

  const [opacity, setOpacity] = useState(30)
  const [color, setColor] = useState('#ffffff')
  const [showNumbers, setShowNumbers] = useState(false)

  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)

  const prevColor = useRef(color)
  const prevOpacity = useRef(opacity)

  // Preferencias en localStorage (cargar/guardar).
  useGridPrefs({ opacity, color, showNumbers, squareCm, setOpacity, setColor, setShowNumbers, setSquareCm, setRealWidthCm })

  // Historial undo/redo (snapshots del estado completo) + atajos.
  const { pushSnapshot, undo, redo, pastData, futureData } = useGridHistory(
    { realWidthCm, squareCm, opacity, color, showNumbers, pan, zoom },
    { setRealWidthCm, setSquareCm, setOpacity, setColor, setShowNumbers, setPan, setZoom },
  )

  const [modalOpen, setModalOpen] = useState(false)
  const [exportWarning, setExportWarning] = useState<string | null>(null)

  const router = useRouter()
  const stageRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
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

  // ── Geometría de la cuadrícula (pura) ──
  const { cols, rows, targetCm, factor, canvasW, canvasH, frameW, frameH, refW, refH, gridStyle } =
    computeGridGeometry({ realWidthCm, squareCm, imgNatural, stage, opacity, color })

  // ── Pan + zoom ──
  const { onPointerDown, onPointerMove, onPointerUp, onWheel, resetView } = useGridPanZoom({
    imageUrl, frameRef, zoom, pan, setZoom, setPan, pushSnapshot,
  })

  // Ancho siempre múltiplo del cuadro
  const snapMul = (cm: number) => snapToSquare(cm, squareCm)
  // Re-ajusta ancho cuando cambia el tamaño del cuadro
  useEffect(() => {
    setRealWidthCm((w) => snapToSquare(w, squareCm))
  }, [squareCm])

  // ── Generador de Blob (cuadrícula renderizada) ──
  const generateGridBlob = (): Promise<Blob> => {
    if (!imageUrl || !frameRef.current) return Promise.reject(new Error('No image'))
    return renderGridBlob({
      imageUrl,
      frameRect: { width: frameRef.current.getBoundingClientRect().width },
      cols, rows, color, opacity, showNumbers, zoom, pan,
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

  return (
    <AppShell>
      <ToolActiveLayout>
        <GridControls
          imageUrl={imageUrl}
          sending={sending}
          isReturn={!!back.current?.boardId}
          canUndo={pastData.current.length > 0}
          canRedo={futureData.current.length > 0}
          realWidthCm={realWidthCm}
          squareCm={squareCm}
          opacity={opacity}
          color={color}
          showNumbers={showNumbers}
          prevColor={prevColor}
          prevOpacity={prevOpacity}
          pushSnapshot={pushSnapshot}
          snapMul={snapMul}
          setRealWidthCm={setRealWidthCm}
          setSquareCm={setSquareCm}
          setOpacity={setOpacity}
          setColor={setColor}
          setShowNumbers={setShowNumbers}
          onChangePhoto={() => setModalOpen(true)}
          onUndo={undo}
          onRedo={redo}
          onReset={resetView}
          onSend={sendToBoards}
          onExport={exportPNG}
        />

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
                <span className="font-mono text-label-sm uppercase tracking-widest">Sube o elige una imagen</span>
              </button>
            )}
          </div>
        </div>

        {/* Pie: métricas + calculadora */}
        <div className="bg-[var(--color-surface-container)] border-t border-[var(--color-outline-variant)] shrink-0 px-[var(--spacing-grid-gutter)] py-2 flex items-center justify-between gap-4 overflow-x-auto whitespace-nowrap">
          <div className="font-mono text-label-sm text-[var(--color-on-surface-variant)] flex items-center gap-3">
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
