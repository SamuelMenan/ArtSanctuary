'use client'

import { useMemo } from 'react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import type { FigureModel } from '@shared/lib/canon/figure'
import { getLandmarks, divisionMarks } from '@shared/lib/canon/landmarks'
import { formatValue, type Unit } from '@shared/lib/canon/units'
import ReferenceFigure from './ReferenceFigure'
import { type View } from '../lib/figureMeta'

// La figura llena el alto del frame (coronilla ~0, planta ~100). Si una lámina
// trajera margen, ajustar estos dos consts.
const FIG_TOP = 0 // % de la coronilla (frac = 0)
const FIG_BOT = 100 // % de la planta (frac = 1)

/** Convierte una fracción de altura (0..1) a % vertical de la caja. */
function mapFrac(frac: number): number {
  return FIG_TOP + frac * (FIG_BOT - FIG_TOP)
}

/** Capas del sistema dual de referencia. Independientes: se ven por separado o
 *  ambas a la vez. */
export interface ChartLayers {
  /** Capa 1 — Canon: divisiones geométricas (1/N), números y altura total. */
  canon: boolean
  /** Capa 2 — Anatomía: líneas + etiquetas de landmarks reales (frac medido). */
  anatomy: boolean
}

export const DEFAULT_LAYERS: ChartLayers = { canon: true, anatomy: true }

/**
 * Interfaz de proporciones dibujada por código alrededor de la figura limpia:
 * título, labels de landmarks (izq, cm acumulado), líneas de división por cabeza,
 * números de división + ALTURA TOTAL (der). Todo paramétrico por `figure`.
 */
export default function ProportionChart({
  figure,
  view,
  layers = DEFAULT_LAYERS,
  unit = 'cm',
}: {
  figure: FigureModel
  view: View
  layers?: ChartLayers
  unit?: Unit
}) {
  const { t } = usePreferences()
  const { canonId, headCount, heightCm, headCm } = figure
  const u = t(`canon.units.${unit}`)

  const divisions = useMemo(() => divisionMarks(headCount), [headCount])
  const landmarks = useMemo(() => getLandmarks(canonId), [canonId])
  const leftLandmarks = useMemo(() => landmarks.filter((l) => l.side !== 'right'), [landmarks])
  const rightLandmarks = useMemo(() => landmarks.filter((l) => l.side === 'right'), [landmarks])

  const lineCls = 'absolute left-0 right-0 border-t border-dashed border-[var(--color-outline-variant)]'

  const renderLabel = (lm: (typeof landmarks)[number], align: 'left' | 'right') => (
    <div
      key={lm.key}
      className={`absolute ${align === 'right' ? 'right-0 items-end text-right' : 'left-0 items-start text-left'} flex flex-col -translate-y-1/2`}
      style={{ top: `${mapFrac(lm.frac)}%` }}
    >
      <span className="font-mono text-[10px] sm:text-label-sm uppercase tracking-wider text-[var(--color-on-surface)] leading-tight">
        {t(`canon.landmarks.${lm.key}`)}
      </span>
      <span className="font-mono text-[9px] sm:text-[11px] text-[var(--color-primary)] leading-tight">
        {formatValue(lm.frac * heightCm, unit, headCm)} {u}
      </span>
    </div>
  )

  return (
    <div className="flex h-full items-stretch justify-center gap-2 sm:gap-4">
      {/* Columna izquierda: landmarks lado izquierdo (Capa Anatomía) */}
      <div className="relative w-24 sm:w-32 shrink-0">{layers.anatomy && leftLandmarks.map((lm) => renderLabel(lm, 'right'))}</div>

      {/* Centro: figura + líneas de canon (Capa 1) + de anatomía (Capa 2) */}
      <div className="relative h-full shrink-0">
        <ReferenceFigure canonId={canonId} view={view} alt={t('canon.referenceAlt')} className="h-full w-auto" />
        <div className="pointer-events-none absolute inset-0">
          {layers.canon &&
            divisions.map((d) => (
              <div key={`div-${d.label}`} className={lineCls} style={{ top: `${mapFrac(d.frac)}%` }} />
            ))}
          {layers.anatomy &&
            landmarks.map((lm) => (
              <div
                key={`lm-${lm.key}`}
                className="absolute left-0 right-0 border-t border-[var(--color-primary)]/70"
                style={{ top: `${mapFrac(lm.frac)}%` }}
              />
            ))}
        </div>
      </div>

      {/* Columna de landmarks lado derecho (Capa Anatomía) */}
      <div className="relative w-24 sm:w-32 shrink-0">{layers.anatomy && rightLandmarks.map((lm) => renderLabel(lm, 'left'))}</div>

      {/* Columna derecha: número de división + ALTURA TOTAL */}
      <div className="relative w-20 sm:w-28 shrink-0 flex">
        {/* Números de división (Capa Canon) */}
        <div className="relative flex-grow">
          {layers.canon && (
            <>
              <span className="absolute right-1 top-0 font-mono text-[9px] uppercase tracking-widest text-[var(--color-on-surface-variant)]">
                {t('canon.division')}
              </span>
              {divisions.map((d) => (
                <span
                  key={`n-${d.label}`}
                  className="absolute right-1 -translate-y-1/2 font-mono text-[10px] sm:text-label-sm text-[var(--color-on-surface-variant)]"
                  style={{ top: `${mapFrac(d.frac)}%` }}
                >
                  {d.label}
                </span>
              ))}
            </>
          )}
        </div>

        {/* Bracket ALTURA TOTAL */}
        <div
          className="relative w-6 sm:w-8"
          style={{ marginTop: `${FIG_TOP}%`, marginBottom: `${100 - FIG_BOT}%` }}
        >
          {layers.canon && (
            <>
              <div className="absolute inset-y-0 left-1/2 border-l border-[var(--color-primary)]" />
              <div className="absolute top-0 left-1/2 right-0 border-t border-[var(--color-primary)]" />
              <div className="absolute bottom-0 left-1/2 right-0 border-t border-[var(--color-primary)]" />
              <div className="absolute top-1/2 left-1/2 ml-2 -translate-y-1/2 whitespace-nowrap [writing-mode:vertical-rl] rotate-180">
                <span className="font-mono text-[9px] sm:text-[11px] uppercase tracking-widest text-[var(--color-primary)]">
                  {t('canon.alturaTotal')} · {formatValue(heightCm, unit, headCm)} {u}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
