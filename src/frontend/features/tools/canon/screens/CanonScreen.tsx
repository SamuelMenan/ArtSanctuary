'use client'

import { MotionConfig, AnimatePresence, motion } from 'motion/react'
import { transition } from '@frontend/shared/motion/tokens'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import ToolWorkspace from '@frontend/features/tools/shared/workspace/ToolWorkspace'
import ProportionChart from '../components/ProportionChart'
import CanonControls from '../components/CanonControls'
import CanonLayersRail from '../components/CanonLayersRail'
import CanonExportRail from '../components/CanonExportRail'
import CanonMeasuresPanel from '../components/CanonMeasuresPanel'
import CanonComparePanel from '../components/CanonComparePanel'
import ChartCrossfade from '../components/ChartCrossfade'
import ZoomPanViewport from '../components/ZoomPanViewport'
import { useCanonTool, AVAILABLE_CANONS, CANON_OPTIONS } from '../hooks/useCanonTool'

export default function CanonPage() {
  const { t } = usePreferences()
  const {
    canonId, setCanonId, height, setHeight, view, setView, unit, setUnit,
    layers, toggleLayer, handleSendToBoard, exporting, handleExport,
    presets, presetId, handleLoadPreset, handleSavePreset, handleDeletePreset,
    compare, toggleCompare, figureB, bView, setBView, setBCanonId, setBHeight,
    figure,
    ghostCanonId, setGhostCanonId,
    activePart, handleSelectPart,
    refUrl, refOpacity, setRefOpacity, handleRefFile, clearRef,
    measureActive, toggleMeasure, measurePoints, addMeasurePoint, clearMeasure,
  } = useCanonTool()

  const measure = { active: measureActive, points: measurePoints, onAdd: addMeasurePoint, onClear: clearMeasure }

  const panel = (
    <CanonControls
      canonId={canonId}
      onCanon={setCanonId}
      canons={CANON_OPTIONS}
      height={height}
      onHeight={setHeight}
      view={view}
      onView={setView}
      unit={unit}
      onUnit={setUnit}
      refUrl={refUrl}
      refOpacity={refOpacity}
      onRefFile={handleRefFile}
      onRefOpacity={setRefOpacity}
      onClearRef={clearRef}
      measureActive={measureActive}
      onToggleMeasure={toggleMeasure}
      onClearMeasure={clearMeasure}
      ghostCanonId={ghostCanonId}
      onGhost={setGhostCanonId}
      ghostCanons={AVAILABLE_CANONS}
      presets={presets}
      presetId={presetId}
      onLoadPreset={handleLoadPreset}
      onSavePreset={handleSavePreset}
      onDeletePreset={handleDeletePreset}
      onSendToBoard={handleSendToBoard}
      compare={compare}
      onToggleCompare={toggleCompare}
    />
  )

  const stageInner = compare ? (
    <div className="flex-1 min-h-0 flex flex-col sm:flex-row items-stretch gap-4 p-4 bg-[var(--color-surface-dim)] overflow-auto custom-scrollbar">
      <CanonComparePanel figure={figure} view={view} unit={unit} layers={layers} />
      <CanonComparePanel
        figure={figureB}
        view={bView}
        unit={unit}
        layers={layers}
        edit={{ canons: AVAILABLE_CANONS, onCanon: setBCanonId, onHeight: setBHeight, onView: setBView }}
      />
    </div>
  ) : (
    <div className="flex-1 min-h-0 flex overflow-hidden">
      <div className="relative flex-1 min-h-0 flex flex-col items-center bg-[var(--color-surface-dim)] overflow-hidden pt-4">
        <h1 className="font-mono text-label-md text-[var(--color-primary)] uppercase tracking-widest mb-3 text-center shrink-0">
          {t('canon.chartTitle', { n: figure.headCount })}
        </h1>
        <CanonLayersRail layers={layers} onToggleLayer={toggleLayer} />
        <CanonExportRail exporting={exporting} onExport={handleExport} />
        <div className="relative flex-1 min-h-0 w-full">
          <ZoomPanViewport panEnabled={!measureActive}>
            <div className="flex h-full items-center justify-center">
              <ChartCrossfade swapKey={`${canonId}-${view}`}>
                <ProportionChart
                  figure={figure}
                  view={view}
                  layers={layers}
                  unit={unit}
                  refUrl={refUrl}
                  refOpacity={refOpacity}
                  measure={measure}
                  ghostCanonId={ghostCanonId}
                  activePart={activePart}
                  onSelectPart={handleSelectPart}
                />
              </ChartCrossfade>
            </div>
          </ZoomPanViewport>
        </div>
      </div>
      <CanonMeasuresPanel figure={figure} unit={unit} view={view} activePart={activePart} onSelectPart={handleSelectPart} />
    </div>
  )

  // Crossfade al entrar/salir del modo Comparar.
  const stage = (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={compare ? 'compare' : 'single'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={transition.base}
        className="flex flex-1 min-h-0 overflow-hidden"
      >
        {stageInner}
      </motion.div>
    </AnimatePresence>
  )

  return (
    <MotionConfig reducedMotion="user">
      <ToolWorkspace panel={panel} stage={stage} />
    </MotionConfig>
  )
}
