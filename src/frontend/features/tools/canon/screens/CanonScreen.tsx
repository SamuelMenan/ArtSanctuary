'use client'

import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import ToolWorkspace from '@frontend/features/tools/shared/workspace/ToolWorkspace'
import ProportionChart from '../components/ProportionChart'
import CanonControls from '../components/CanonControls'
import CanonTopBar from '../components/CanonTopBar'
import CanonMeasuresPanel from '../components/CanonMeasuresPanel'
import CanonComparePanel from '../components/CanonComparePanel'
import CanonLearnCard from '../components/CanonLearnCard'
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
    figure, measurements,
    ghostCanonId, setGhostCanonId,
    refUrl, refOpacity, setRefOpacity, handleRefFile, clearRef,
    measureActive, toggleMeasure, measurePoints, addMeasurePoint, clearMeasure,
    helpMode, toggleHelp,
  } = useCanonTool()

  const measure = { active: measureActive, points: measurePoints, onAdd: addMeasurePoint, onClear: clearMeasure }

  const panel = (
    <CanonControls
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
      helpMode={helpMode}
      onToggleHelp={toggleHelp}
      presets={presets}
      presetId={presetId}
      onLoadPreset={handleLoadPreset}
      onSavePreset={handleSavePreset}
      onDeletePreset={handleDeletePreset}
      onSendToBoard={handleSendToBoard}
      compare={compare}
      onToggleCompare={toggleCompare}
      exporting={exporting}
      onExport={handleExport}
    />
  )

  const stage = compare ? (
    <div className="flex-1 min-h-0 flex flex-col sm:flex-row items-stretch gap-4 p-4 bg-[var(--color-surface-dim)] overflow-auto">
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
      <div className="relative flex-1 min-h-0 flex flex-col items-center bg-[var(--color-surface-dim)] overflow-hidden p-4">
        <h1 className="font-mono text-label-md text-[var(--color-primary)] uppercase tracking-widest mb-3 text-center shrink-0">
          {t('canon.chartTitle', { n: figure.headCount })}
        </h1>
        {helpMode && <CanonLearnCard canonId={figure.canonId} onClose={toggleHelp} />}
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
                />
              </ChartCrossfade>
            </div>
          </ZoomPanViewport>
        </div>
      </div>
      <CanonMeasuresPanel measurements={measurements} unit={unit} headCm={figure.headCm} canonId={figure.canonId} view={view} />
    </div>
  )

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <CanonTopBar
        canonId={canonId}
        onCanon={setCanonId}
        canons={CANON_OPTIONS}
        height={height}
        onHeight={setHeight}
        view={view}
        onView={setView}
        unit={unit}
        onUnit={setUnit}
        layers={layers}
        onToggleLayer={toggleLayer}
      />
      <ToolWorkspace panel={panel} stage={stage} />
    </div>
  )
}
