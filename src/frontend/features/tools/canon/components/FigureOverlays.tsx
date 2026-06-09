'use client'

import { useMemo, type MouseEvent } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'motion/react'
import { growX, popIn, lineDraw, transition } from '@frontend/shared/motion/tokens'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import type { FigureModel } from '@shared/lib/canon/figure'
import { getLandmarks } from '@shared/lib/canon/landmarks'
import { formatValue, type Unit } from '@shared/lib/canon/units'
import { type View } from '../lib/figureMeta'
import { widthFrac, distanceCm } from '../lib/figureGeom'

export interface MeasureState {
  active: boolean
  points: { x: number; y: number }[]
  onAdd: (p: { x: number; y: number }) => void
  onClear: () => void
}

/** Overlays interactivos DENTRO de la caja de la figura (absolute inset-0):
 *  imagen de calco, marcas de ancho y regla. Cada uno se activa por su flag. */
export default function FigureOverlays({
  figure,
  view,
  unit,
  showWidths,
  refUrl,
  refOpacity,
  measure,
}: {
  figure: FigureModel
  view: View
  unit: Unit
  showWidths: boolean
  refUrl: string | null
  refOpacity: number
  measure: MeasureState
}) {
  const { t } = usePreferences()
  const { canonId, heightCm, headCm, widthsCm } = figure

  // Altura (frac) de cada ancho, tomada de los landmarks medidos.
  const widthMarks = useMemo(() => {
    if (!showWidths) return []
    const lm = getLandmarks(canonId)
    const at = (k: string) => lm.find((l) => l.key === k)?.frac
    const rows: { key: string; frac: number; cm: number }[] = []
    const push = (key: string, frac: number | undefined, cm: number) => {
      if (frac != null) rows.push({ key, frac, cm })
    }
    push('shouldersW', at('hombros'), widthsCm.shoulders)
    push('waistW', at('ombligo'), widthsCm.waist)
    push('pelvisW', at('entrepierna'), widthsCm.pelvis)
    return rows
  }, [showWidths, canonId, widthsCm])

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!measure.active) return
    const r = e.currentTarget.getBoundingClientRect()
    measure.onAdd({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height })
  }

  const [a, b] = measure.points
  const dist = a && b ? distanceCm(canonId, view, heightCm, a, b) : null

  return (
    <>
      {/* Calco: imagen propia del usuario, opacidad ajustable. */}
      {refUrl && (
        <Image
          src={refUrl}
          alt={t('canon.reference')}
          fill
          sizes="(max-width: 640px) 50vw, 320px"
          unoptimized
          className="pointer-events-none object-contain"
          style={{ opacity: refOpacity }}
        />
      )}

      {/* Marcas de ancho: línea media + segmento horizontal centrado por marca. */}
      <AnimatePresence>
        {showWidths && (
          <motion.div key="widths" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={transition.fast} className="pointer-events-none absolute inset-0">
            <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-[var(--color-tertiary)]/70" />
            {widthMarks.map((m) => {
              const wf = widthFrac(canonId, view, heightCm, m.cm)
              return (
                <div key={m.key} className="absolute -translate-y-1/2" style={{ top: `${m.frac * 100}%`, left: `${50 - (wf * 100) / 2}%`, width: `${wf * 100}%` }}>
                  {/* El trazo crece desde el centro (refuerza la lectura "ancho"). */}
                  <motion.div variants={growX} initial="initial" animate="animate" style={{ transformOrigin: 'center' }} className="border-t-2 border-[var(--color-tertiary)]" />
                  <span className="absolute left-1/2 -translate-x-1/2 -translate-y-full font-mono text-[9px] text-[var(--color-tertiary)] whitespace-nowrap">
                    {formatValue(m.cm, unit, headCm)}
                  </span>
                </div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Regla: capa que captura clicks (solo activa), puntos + línea + distancia. */}
      <div className={`absolute inset-0 ${measure.active ? 'cursor-crosshair' : 'pointer-events-none'}`} onClick={onClick}>
        {measure.points.map((p, i) => (
          <motion.div
            key={i}
            variants={popIn}
            initial="initial"
            animate="animate"
            className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-[var(--color-secondary)]"
            style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
          />
        ))}
        {a && b && (
          <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
            <motion.line
              variants={lineDraw}
              initial="initial"
              animate="animate"
              x1={`${a.x * 100}%`} y1={`${a.y * 100}%`} x2={`${b.x * 100}%`} y2={`${b.y * 100}%`}
              stroke="var(--color-secondary)" strokeWidth={1.5} strokeDasharray="4 3"
            />
          </svg>
        )}
        <AnimatePresence>
          {dist != null && b && (
            <motion.span
              variants={popIn}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded bg-[var(--color-secondary)] px-1 font-mono text-[10px] text-[var(--color-on-secondary)] whitespace-nowrap"
              style={{ left: `${((a.x + b.x) / 2) * 100}%`, top: `${((a.y + b.y) / 2) * 100}%` }}
            >
              {formatValue(dist, unit, headCm)} · {(dist / headCm).toFixed(2)} {t('canon.units.heads')}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
