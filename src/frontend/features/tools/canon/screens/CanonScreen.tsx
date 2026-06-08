'use client'

import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import MeasurementsPanel from '../components/MeasurementsPanel'
import ProportionChart from '../components/ProportionChart'
import CanonToolbar from '../components/CanonToolbar'
import CanonTraceBar from '../components/CanonTraceBar'
import CanonPresets from '../components/CanonPresets'
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
    figure, measurements,
    ghostCanonId, setGhostCanonId,
    refUrl, refOpacity, setRefOpacity, handleRefFile, clearRef,
    measureActive, toggleMeasure, measurePoints, addMeasurePoint, clearMeasure,
  } = useCanonTool()

  const measure = { active: measureActive, points: measurePoints, onAdd: addMeasurePoint, onClear: clearMeasure }

  return (
    <>
        <CanonToolbar
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
          onSendToBoard={handleSendToBoard}
          ghostCanonId={ghostCanonId}
          onGhost={setGhostCanonId}
          ghostCanons={AVAILABLE_CANONS}
          compare={compare}
          onToggleCompare={toggleCompare}
          exporting={exporting}
          onExport={handleExport}
        />

        <CanonTraceBar
          refUrl={refUrl}
          refOpacity={refOpacity}
          onRefFile={handleRefFile}
          onRefOpacity={setRefOpacity}
          onClearRef={clearRef}
          measureActive={measureActive}
          onToggleMeasure={toggleMeasure}
          onClearMeasure={clearMeasure}
        />

        <CanonPresets
          presets={presets}
          selectedId={presetId}
          onLoad={handleLoadPreset}
          onSave={handleSavePreset}
          onDelete={handleDeletePreset}
        />

        {/* Main Area: chart único + panel, o comparador de dos figuras */}
        <div className="flex-grow min-h-0 flex flex-col lg:flex-row bg-[var(--color-surface-container-lowest)] overflow-hidden">
          {compare ? (
            <div className="flex-grow min-h-[320px] flex flex-col sm:flex-row items-stretch gap-4 p-4 bg-[var(--color-surface-dim)] overflow-auto">
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
            <>
              {/* Lámina limpia + interfaz dibujada por código. Todo paramétrico. */}
              <div className="flex-grow min-h-[320px] flex flex-col items-center p-4 bg-[var(--color-surface-dim)] overflow-auto">
                <h1 className="font-mono text-label-md text-[var(--color-primary)] uppercase tracking-widest mb-4 text-center shrink-0">
                  {t('canon.chartTitle', { n: figure.headCount })}
                </h1>
                <div className="relative h-[72vh] max-h-[880px] w-full">
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

              {/* Panel de medidas paramétrico */}
              <aside className="w-full lg:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] overflow-y-auto p-5">
                <h2 className="font-mono text-label-sm text-[var(--color-primary)] uppercase tracking-widest mb-2">{t('canon.canon')} · {t(`canon.names.${figure.canonId}`)}</h2>
                <MeasurementsPanel measurements={measurements} unit={unit} headCm={figure.headCm} />
              </aside>
            </>
          )}
        </div>

        {/* Bottom Status Bar */}
        <div className="h-8 border-t border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] flex items-center px-6 justify-between shrink-0 overflow-x-auto whitespace-nowrap gap-4">
          <span className="font-mono text-[10px] text-[var(--color-on-surface-variant)] uppercase tracking-widest">{`${t('canon.systemPrefix')}: ${t(`canon.names.${figure.canonId}`)}`.toUpperCase()}</span>
          <span className="font-mono text-[10px] text-[var(--color-on-surface-variant)] uppercase tracking-widest">{t('canon.baseUnit', { n: figure.headCm.toFixed(2) }).toUpperCase()}</span>
        </div>
    </>
  )
}
