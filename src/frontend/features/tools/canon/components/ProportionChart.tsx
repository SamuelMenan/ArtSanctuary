'use client'

import { useMemo } from 'react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import type { FigureModel } from '@shared/lib/canon/figure'
import { getLandmarks, divisionMarks } from '@shared/lib/canon/landmarks'
import { formatValue, type Unit } from '@shared/lib/canon/units'
import Image from 'next/image'
import ReferenceFigure from './ReferenceFigure'
import { type View } from '../lib/figureMeta'
import { DEFAULT_LAYERS, type ChartLayers } from '../lib/chartLayers'
import { overlaySrc } from '../lib/overlays'
import { getJoints } from '../lib/joints'
import FigureOverlays, { type MeasureState } from './FigureOverlays'
import LandmarkLabel from './LandmarkLabel'
import ChartAxis from './ChartAxis'
import GhostFigure from './GhostFigure'
import LoomisOverlay from './LoomisOverlay'

const NO_MEASURE: MeasureState = { active: false, points: [], onAdd: () => {}, onClear: () => {} }

// La figura llena el alto del frame (coronilla ~0, planta ~100). Si una lámina
// trajera margen, ajustar estos dos consts.
const FIG_TOP = 0 // % de la coronilla (frac = 0)
const FIG_BOT = 100 // % de la planta (frac = 1)

/** Convierte una fracción de altura (0..1) a % vertical de la caja. */
function mapFrac(frac: number): number {
  return FIG_TOP + frac * (FIG_BOT - FIG_TOP)
}

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
  refUrl = null,
  refOpacity = 0.5,
  measure = NO_MEASURE,
  ghostCanonId = null,
}: {
  figure: FigureModel
  view: View
  layers?: ChartLayers
  unit?: Unit
  refUrl?: string | null
  refOpacity?: number
  measure?: MeasureState
  ghostCanonId?: string | null
}) {
  const { t } = usePreferences()
  const { canonId, headCount, heightCm, headCm } = figure
  const u = t(`canon.units.${unit}`)

  const divisions = useMemo(() => divisionMarks(headCount), [headCount])
  const landmarks = useMemo(() => getLandmarks(canonId), [canonId])
  const leftLandmarks = useMemo(() => landmarks.filter((l) => l.side !== 'right'), [landmarks])
  const rightLandmarks = useMemo(() => landmarks.filter((l) => l.side === 'right'), [landmarks])
  const skeletonSrc = layers.skeleton ? overlaySrc(canonId, 'skeleton', view) : null
  const musclesSrc = layers.muscles ? overlaySrc(canonId, 'muscles', view) : null
  const joints = useMemo(() => (layers.joints ? getJoints(canonId, view) : []), [layers.joints, canonId, view])

  const lineCls = 'absolute left-0 right-0 border-t border-dashed border-[var(--color-outline-variant)]'

  const renderLabel = (lm: (typeof landmarks)[number], align: 'left' | 'right') => (
    <LandmarkLabel
      key={lm.key}
      lm={lm}
      align={align}
      top={mapFrac(lm.frac)}
      valueText={`${formatValue(lm.frac * heightCm, unit, headCm)} ${u}`}
    />
  )

  return (
    <div className="flex h-full items-stretch justify-center gap-2 sm:gap-4">
      {/* Columna izquierda: landmarks lado izquierdo (Capa Anatomía) */}
      <div className="relative w-24 sm:w-32 shrink-0">{layers.anatomy && leftLandmarks.map((lm) => renderLabel(lm, 'right'))}</div>

      {/* Centro: figura + overlays (esqueleto/músculos) + líneas + joints */}
      <div className="relative h-full shrink-0">
        <ReferenceFigure canonId={canonId} view={view} alt={t('canon.referenceAlt')} className="h-full w-auto" />
        {/* Overlays anatómicos: PNG alineado coronilla→planta sobre la figura. */}
        {skeletonSrc && (
          <Image src={skeletonSrc} alt={t('canon.skeleton')} fill sizes="(max-width: 640px) 50vw, 320px" priority className="pointer-events-none object-contain" />
        )}
        {musclesSrc && (
          <Image src={musclesSrc} alt={t('canon.muscles')} fill sizes="(max-width: 640px) 50vw, 320px" priority className="pointer-events-none object-contain opacity-80" />
        )}
        {ghostCanonId && ghostCanonId !== canonId && <GhostFigure canonId={ghostCanonId} view={view} />}
        {layers.loomis && <LoomisOverlay canonId={canonId} view={view} />}
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
          {joints.map((j) => (
            <div
              key={`joint-${j.key}`}
              title={t(`canon.jointNames.${j.key}`)}
              className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-[var(--color-primary)]"
              style={{ left: `${j.x * 100}%`, top: `${mapFrac(j.frac)}%` }}
            />
          ))}
        </div>
        <FigureOverlays
          figure={figure}
          view={view}
          unit={unit}
          showWidths={layers.widths}
          refUrl={refUrl}
          refOpacity={refOpacity}
          measure={measure}
        />
      </div>

      {/* Columna de landmarks lado derecho (Capa Anatomía) */}
      <div className="relative w-24 sm:w-32 shrink-0">{layers.anatomy && rightLandmarks.map((lm) => renderLabel(lm, 'left'))}</div>

      <ChartAxis
        show={layers.canon}
        divisions={divisions}
        mapFrac={mapFrac}
        figTop={FIG_TOP}
        figBot={FIG_BOT}
        divisionLabel={t('canon.division')}
        heightLabel={t('canon.alturaTotal')}
        heightValue={`${formatValue(heightCm, unit, headCm)} ${u}`}
      />
    </div>
  )
}
