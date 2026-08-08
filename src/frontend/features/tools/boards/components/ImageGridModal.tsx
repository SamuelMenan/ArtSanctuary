'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { scaleIn, transition } from '@frontend/shared/motion/tokens'
import { cmOf, type Scaler } from '@shared/lib/measure'
import type { BoardObject } from '@shared/lib/boards/types'
import { computeGridGeometry } from '@frontend/features/tools/grid/lib/gridGeometry'
import { renderGridBlob } from '@frontend/features/tools/grid/lib/renderGridBlob'
import { colLabel } from '@frontend/features/tools/grid/lib/colLabel'
import ToolButton from '@frontend/features/tools/shared/workspace/ToolButton'
import ToolSlider from '@frontend/features/tools/shared/workspace/ToolSlider'
import Select from '@frontend/shared/ui/Select'
import { SHEET_SIZES, type SheetSize } from '../lib/sheetSizes'
import { exportImageGridPdf } from '../lib/imageGridPdf'

const CM_PRESETS = [1, 2, 5] as const
const PDF_MARGIN_CM = 1

/**
 * Modal "Cuadrícula + PDF a escala" para una imagen del board. Replica la
 * herramienta Cuadrícula (celda/opacidad/color/números) sobre la imagen
 * seleccionada y ofrece dos salidas: PDF a escala (tamaño de hoja seleccionable
 * vía dropdown: pliego, medio pliego, A0-A4, etc.) o imagen PNG con la
 * cuadrícula quemada. Muestra DOS vistas previas: la imagen cuadriculada y el
 * troceado en hojas del PDF. El ancho real sale de la medida física del objeto.
 */
export default function ImageGridModal({
  obj,
  scaler,
  name,
  onClose,
  onApplyGrid,
}: {
  obj: BoardObject
  scaler: Scaler
  name: string
  onClose: () => void
  onApplyGrid: (gridCm: number) => void
}) {
  const { t } = usePreferences()
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(true)
  const requestClose = useCallback(() => setVisible(false), [])

  const [squareCm, setSquareCm] = useState(obj.gridCm && obj.gridCm > 0 ? obj.gridCm : 2)
  const [opacity, setOpacity] = useState(40)
  const [color, setColor] = useState('#ef4444')
  const [showNumbers, setShowNumbers] = useState(true)
  const [sheet, setSheet] = useState<SheetSize>(SHEET_SIZES[0])
  const [landscape, setLandscape] = useState(false)
  const [view, setView] = useState<'image' | 'pdf'>('image')
  const [page, setPage] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') requestClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [requestClose])

  const realWidthCm = cmOf(obj.w)
  const imgNatural = useMemo(() => ({ w: obj.w || 4, h: obj.h || 3 }), [obj.w, obj.h])

  // Cuadrícula de la IMAGEN (cuadros cuadrados, igual que el PNG/herramienta).
  const { cols, rows, refW, refH, gridStyle } = computeGridGeometry({
    realWidthCm, squareCm, imgNatural, stage: { w: 0, h: 0 }, opacity, color,
  })

  // Troceado del PDF a la hoja elegida (mismo cálculo que imageGridPdf).
  const wCm = cmOf(obj.w)
  const hCm = cmOf(obj.h)
  const pageW = landscape ? sheet.hCm : sheet.wCm
  const pageH = landscape ? sheet.wCm : sheet.hCm
  const pdfCols = Math.max(1, Math.ceil(wCm / squareCm))
  const pdfRows = Math.max(1, Math.ceil(hCm / squareCm))
  const colsPerPage = Math.max(1, Math.floor((pageW - 2 * PDF_MARGIN_CM) / squareCm))
  const rowsPerPage = Math.max(1, Math.floor((pageH - 2 * PDF_MARGIN_CM) / squareCm))
  const pagesX = Math.ceil(pdfCols / colsPerPage)
  const pagesY = Math.ceil(pdfRows / rowsPerPage)
  const totalPages = pagesX * pagesY

  // Hoja visible (clamp): la página se ordena por filas. Recorte de su tile.
  const safePage = Math.max(0, Math.min(page, totalPages - 1))
  const pageX = safePage % pagesX
  const pageY = Math.floor(safePage / pagesX)
  const startCol = pageX * colsPerPage
  const endCol = Math.min(pdfCols, (pageX + 1) * colsPerPage)
  const startRow = pageY * rowsPerPage
  const endRow = Math.min(pdfRows, (pageY + 1) * rowsPerPage)
  const tileCols = Math.max(1, endCol - startCol)
  const tileRows = Math.max(1, endRow - startRow)

  // Cuadrícula a las dimensiones del PDF (cols/filas ceil), líneas finas.
  const alphaHex = Math.round(opacity * 2.55).toString(16).padStart(2, '0')
  const pdfGridStyle = {
    backgroundImage:
      `linear-gradient(to right, ${color}${alphaHex} 1px, transparent 1px),` +
      `linear-gradient(to bottom, ${color}${alphaHex} 1px, transparent 1px)`,
    backgroundSize: `${100 / pdfCols}% ${100 / pdfRows}%`,
  }

  // ── Salida: imagen PNG con la cuadrícula quemada ──
  const exportImage = async () => {
    if (!obj.src) return
    setBusy(true)
    setError(null)
    try {
      const blob = await renderGridBlob({
        imageUrl: obj.src,
        frameRect: { width: 1 }, // irrelevante con pan=0 (no afecta la salida)
        cols, rows, color, opacity, showNumbers, zoom: 1, pan: { x: 0, y: 0 },
      })
      const ext = blob.type === 'image/webp' ? 'webp' : 'png'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${(name || 'imagen').trim() || 'imagen'}-cuadricula.${ext}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError(t('boards.exportError'))
    } finally {
      setBusy(false)
    }
  }

  // ── Salida: PDF a escala troceado en el tamaño de hoja elegido ──
  const exportPdf = async () => {
    setBusy(true)
    setError(null)
    try {
      await exportImageGridPdf(obj, scaler, name, { sheet, landscape, gridCm: squareCm, color, opacity, showNumbers })
    } catch {
      setError(t('boards.exportError'))
    } finally {
      setBusy(false)
    }
  }

  if (!mounted) return null

  const lbl = 'font-mono text-[10px] text-[var(--color-on-surface-variant)] uppercase tracking-[0.08em]'
  const cap = 'font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-on-surface-variant)] text-center'
  const sheetOptions = SHEET_SIZES.map((s) => {
    const w = landscape ? s.hCm : s.wCm
    const h = landscape ? s.wCm : s.hCm
    return { value: s.id, label: `${t(`boards.${s.labelKey}`)} · ${w}×${h} cm` }
  })

  return createPortal(
    <AnimatePresence onExitComplete={onClose}>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) requestClose() }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition.fast}
        >
          <motion.div
            className="bg-[var(--color-surface-container-lowest)] w-full max-w-4xl rounded-sm shadow-2xl overflow-hidden ring-1 ring-[var(--color-outline-variant)] flex flex-col max-h-[88vh]"
            role="dialog"
            aria-modal="true"
            aria-label={t('boards.imageToolTitle')}
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {/* Header */}
            <div className="p-4 border-b border-[var(--color-outline-variant)] flex items-center justify-between shrink-0">
              <h3 className="font-sans font-bold text-[var(--color-primary)] flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]" aria-hidden>grid_on</span>
                {t('boards.imageToolTitle')}
              </h3>
              <button onClick={requestClose} aria-label={t('common.close')} className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]">
                <span className="material-symbols-outlined" aria-hidden>close</span>
              </button>
            </div>

            <div className="flex flex-col md:flex-row min-h-0 flex-1">
              {/* Vista previa: selector Imagen / PDF (hoja a hoja) */}
              <div className="flex-1 min-h-0 flex flex-col gap-2 p-4">
                {/* Switcher de vista */}
                <div className="flex items-center gap-0.5 self-center rounded-lg border border-[var(--color-outline-variant)] p-0.5">
                  {(['image', 'pdf'] as const).map((v) => (
                    <button
                      key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v}
                      className={`h-8 px-3 rounded-md font-mono text-[11px] uppercase tracking-[0.08em] transition-colors ${view === v ? 'bg-[var(--color-primary)]/12 text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'}`}
                    >
                      {v === 'image' ? t('boards.previewImage') : t('boards.previewPdf')}
                    </button>
                  ))}
                </div>

                {view === 'image' ? (
                  <>
                    <PreviewFrame cols={cols} rows={rows}>
                      {obj.src && (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img alt={name} src={obj.src} draggable={false} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
                          <div className="absolute inset-0 pointer-events-none" style={gridStyle} />
                          {showNumbers && (
                            <div className="absolute inset-0 grid pointer-events-none" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}>
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
                      )}
                    </PreviewFrame>
                    <span className={`${cap} tabular-nums`}>{scaler.formatScaled(refW)} × {scaler.formatScaled(refH)}</span>
                  </>
                ) : (
                  <>
                    <PreviewFrame cols={tileCols} rows={tileRows}>
                      {obj.src && (
                        <div
                          className="absolute"
                          style={{
                            left: `${(-100 * startCol) / tileCols}%`,
                            top: `${(-100 * startRow) / tileRows}%`,
                            width: `${(100 * pdfCols) / tileCols}%`,
                            height: `${(100 * pdfRows) / tileRows}%`,
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img alt={name} src={obj.src} draggable={false} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
                          <div className="absolute inset-0 pointer-events-none" style={pdfGridStyle} />
                          {showNumbers && (
                            <div className="absolute inset-0 grid pointer-events-none" style={{ gridTemplateColumns: `repeat(${pdfCols}, 1fr)`, gridTemplateRows: `repeat(${pdfRows}, 1fr)` }}>
                              {Array.from({ length: pdfCols * pdfRows }).map((_, i) => {
                                const c = i % pdfCols
                                const r = Math.floor(i / pdfCols)
                                return (
                                  <span key={i} className="font-mono leading-none p-0.5 text-[9px]" style={{ color, opacity: Math.min(1, opacity / 100 + 0.3) }}>
                                    {colLabel(c)}{r + 1}
                                  </span>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </PreviewFrame>
                    {/* Navegación entre hojas */}
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button" onClick={() => setPage(safePage - 1)} disabled={safePage <= 0}
                        aria-label={t('boards.prevPage')}
                        className="size-8 flex items-center justify-center rounded-lg border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:border-[var(--color-outline)] disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <span className="material-symbols-outlined text-[18px]" aria-hidden>chevron_left</span>
                      </button>
                      <span className={`${cap} tabular-nums`}>
                        {t('boards.sheetNav', { k: safePage + 1, n: totalPages })} · {t('boards.pageColRow', { x: pageX + 1, y: pageY + 1 })}
                      </span>
                      <button
                        type="button" onClick={() => setPage(safePage + 1)} disabled={safePage >= totalPages - 1}
                        aria-label={t('boards.nextPage')}
                        className="size-8 flex items-center justify-center rounded-lg border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:border-[var(--color-outline)] disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <span className="material-symbols-outlined text-[18px]" aria-hidden>chevron_right</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Controles */}
              <div className="w-full md:w-72 shrink-0 border-t md:border-t-0 md:border-l border-[var(--color-outline-variant)] p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                {/* Cuadro */}
                <div className="flex flex-col gap-2">
                  <span className={lbl}>{t('grid.square')}</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number" min={0.1} step={0.5} value={squareCm}
                      aria-label={t('grid.square')}
                      onChange={(e) => setSquareCm(Math.max(0.1, Number(e.target.value)))}
                      className="w-16 bg-transparent border-b border-[var(--color-outline-variant)] px-0.5 py-0.5 font-mono text-label-sm text-[var(--color-primary)] text-center focus:border-[var(--color-primary)] outline-none"
                    />
                    <span className={lbl}>cm</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {CM_PRESETS.map((p) => {
                      const on = Math.abs(squareCm - p) < 0.01
                      return (
                        <button
                          key={p} type="button" onClick={() => setSquareCm(p)}
                          className={`flex-1 h-9 rounded-lg border text-[10px] font-semibold transition-colors ${on ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:border-[var(--color-outline)] hover:text-[var(--color-on-surface)]'}`}
                        >{p} cm</button>
                      )
                    })}
                  </div>
                </div>

                {/* Estilo */}
                <div className="flex flex-col gap-2">
                  <ToolSlider icon="opacity" min={0} max={100} value={opacity} suffix="%" onChange={setOpacity} />
                  <div className="flex items-center gap-2">
                    <div className="size-9 shrink-0 rounded-lg border border-[var(--color-outline-variant)] hover:border-[var(--color-outline)] transition-colors relative overflow-hidden" title={t('grid.color')}>
                      <input type="color" aria-label={t('grid.color')} value={color} onChange={(e) => setColor(e.target.value)} className="absolute inset-[-25%] size-[150%] cursor-pointer" />
                    </div>
                    <ToolButton variant="toggle" icon="tag" label={t('grid.numbers')} active={showNumbers} onClick={() => setShowNumbers((v) => !v)} className="flex-1" />
                  </div>
                </div>

                {/* Tamaño de hoja (PDF) */}
                <div className="flex flex-col gap-2">
                  <span className={lbl}>{t('boards.sheetSize')}</span>
                  <Select
                    ariaLabel={t('boards.sheetSize')}
                    value={sheet.id}
                    onChange={(id) => setSheet(SHEET_SIZES.find((s) => s.id === id) ?? SHEET_SIZES[0])}
                    options={sheetOptions}
                  />
                  <ToolButton
                    variant="toggle" icon={landscape ? 'crop_landscape' : 'crop_portrait'}
                    label={landscape ? t('boards.landscape') : t('boards.portrait')}
                    active={landscape} onClick={() => setLandscape((v) => !v)} className="w-full"
                  />
                </div>

                {error && <p className="font-sans text-xs text-red-500 bg-red-500/10 border border-red-500/30 rounded-sm px-2 py-1.5">{error}</p>}

                {/* Acciones */}
                <div className="mt-auto flex flex-col gap-2 pt-2">
                  <ToolButton variant="ghost" icon="grid_on" label={t('boards.applyGrid')} disabled={busy} onClick={() => onApplyGrid(squareCm)} className="w-full" />
                  <div className="flex gap-2">
                    <ToolButton variant="ghost" icon="image" label={t('boards.exportImage')} disabled={busy} onClick={exportImage} className="flex-1" />
                    <ToolButton variant="action" icon="picture_as_pdf" label={t('boards.exportPdf')} disabled={busy} onClick={exportPdf} className="flex-1" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/**
 * Encaja un marco `cols:rows` (celdas cuadradas) dentro del espacio disponible,
 * midiéndolo con un ResizeObserver propio. Al ser un componente aparte su efecto
 * corre cuando su ref ya está montada (el padre lo renderiza tras `mounted`).
 */
function PreviewFrame({ cols, rows, children }: { cols: number; rows: number; children: ReactNode }) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect
      setBox({ w: cr.width, h: cr.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const fit = Math.min((box.w || 0) / cols, (box.h || 0) / rows)
  const w = fit > 0 ? cols * fit : 0
  const h = fit > 0 ? rows * fit : 0
  return (
    <div ref={boxRef} className="flex-1 min-h-[180px] flex items-center justify-center overflow-hidden">
      <div
        className="relative border border-[var(--color-outline-variant)] shadow-xl bg-[var(--color-surface)] overflow-hidden select-none"
        style={{ width: w || undefined, height: h || undefined, aspectRatio: `${cols} / ${rows}` }}
      >
        {children}
      </div>
    </div>
  )
}
