'use client'

import type { RefObject, Dispatch, SetStateAction } from 'react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { ToolRow, ToolPanelFooter } from '@frontend/features/tools/shared/workspace/ToolPanel'
import ToolCluster from '@frontend/features/tools/shared/workspace/ToolCluster'
import ToolButton from '@frontend/features/tools/shared/workspace/ToolButton'
import ToolSlider from '@frontend/features/tools/shared/workspace/ToolSlider'
import SourceButton from '@frontend/features/tools/shared/workspace/SourceButton'
import HistoryButtons from '@frontend/features/tools/shared/workspace/HistoryButtons'
import SendActions from '@frontend/features/tools/shared/workspace/SendActions'
import type { GridSnapshot } from '../hooks/useGridHistory'

const CM_PRESETS = [1.5, 28] as const
const lbl = 'font-mono text-[10px] text-[var(--color-on-surface-variant)] uppercase tracking-[0.08em]'
const numInput =
  'w-12 bg-transparent border-0 border-b border-[var(--color-outline-variant)] px-0.5 py-0.5 font-mono text-label-sm text-[var(--color-primary)] text-center focus:border-[var(--color-primary)] outline-none'
const stepBtn = 'material-symbols-outlined text-[16px] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] leading-none'

/** Contenido del panel de la cuadrícula (vertical, sin scroll). */
export default function GridControls({
  imageUrl,
  sending,
  isReturn,
  canUndo,
  canRedo,
  realWidthCm,
  squareCm,
  opacity,
  color,
  showNumbers,
  prevColor,
  prevOpacity,
  pushSnapshot,
  snapMul,
  setRealWidthCm,
  setSquareCm,
  setOpacity,
  setColor,
  setShowNumbers,
  onChangePhoto,
  onUndo,
  onRedo,
  onReset,
  onZoomIn,
  onZoomOut,
  onSend,
  onExport,
}: {
  imageUrl: string | null
  sending: boolean
  isReturn: boolean
  canUndo: boolean
  canRedo: boolean
  realWidthCm: number
  squareCm: number
  opacity: number
  color: string
  showNumbers: boolean
  prevColor: RefObject<string>
  prevOpacity: RefObject<number>
  pushSnapshot: (override?: Partial<GridSnapshot>) => void
  snapMul: (cm: number) => number
  setRealWidthCm: Dispatch<SetStateAction<number>>
  setSquareCm: Dispatch<SetStateAction<number>>
  setOpacity: Dispatch<SetStateAction<number>>
  setColor: Dispatch<SetStateAction<string>>
  setShowNumbers: Dispatch<SetStateAction<boolean>>
  onChangePhoto: () => void
  onUndo: () => void
  onRedo: () => void
  onReset: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onSend: () => void
  onExport: () => void
}) {
  const { t } = usePreferences()
  return (
    <>
      <SourceButton onClick={onChangePhoto} />
      <ToolRow>
        <HistoryButtons fill canUndo={canUndo} canRedo={canRedo} onUndo={onUndo} onRedo={onRedo} />
        <ToolButton variant="icon" icon="recenter" title={t('grid.centerTip')} disabled={!imageUrl} onClick={onReset} className="flex-1 min-w-0" />
        <ToolButton variant="icon" icon="zoom_out" title={t('grid.zoomOut')} disabled={!imageUrl} onClick={onZoomOut} className="flex-1 min-w-0" />
        <ToolButton variant="icon" icon="zoom_in" title={t('grid.zoomIn')} disabled={!imageUrl} onClick={onZoomIn} className="flex-1 min-w-0" />
      </ToolRow>

      <ToolCluster name={t('grid.measures')}>
        <div className="flex items-center justify-between gap-2">
          <span className={lbl}>{t('grid.width')}</span>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => { pushSnapshot(); setRealWidthCm((w) => snapMul(w - squareCm)); }} className={stepBtn} aria-label={t('grid.minusSquareTip')}>remove</button>
            <input
              type="number" aria-label={t('grid.width')} min={squareCm} step={squareCm} value={realWidthCm}
              onFocus={() => pushSnapshot()}
              onChange={(e) => setRealWidthCm(Number(e.target.value))}
              onBlur={(e) => setRealWidthCm(snapMul(Number(e.target.value)))}
              className={numInput}
            />
            <button type="button" onClick={() => { pushSnapshot(); setRealWidthCm((w) => snapMul(w + squareCm)); }} className={stepBtn} aria-label={t('grid.plusSquareTip')}>add</button>
            <span className={lbl}>cm</span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className={lbl}>{t('grid.square')}</span>
          <div className="flex items-center gap-1.5">
            <input type="number" aria-label={t('grid.square')} min={0.1} step={0.5} value={squareCm} onFocus={() => pushSnapshot()} onChange={(e) => setSquareCm(Math.max(0.1, Number(e.target.value)))} className={numInput} />
            <span className={lbl}>cm</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {CM_PRESETS.map((preset) => {
            const active = Math.abs(squareCm - preset) < 0.01
            return (
              <button
                key={preset}
                type="button"
                onClick={() => { pushSnapshot(); setSquareCm(preset) }}
                title={t('grid.usePreset', { n: preset })}
                className={`flex-1 h-9 rounded-lg border text-[10px] font-semibold transition-colors duration-150 ${active ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:border-[var(--color-outline)] hover:text-[var(--color-on-surface)]'}`}
              >
                {preset} cm
              </button>
            )
          })}
        </div>
      </ToolCluster>

      <ToolCluster name={t('grid.style')}>
        <ToolSlider
          icon="opacity"
          min={0}
          max={100}
          value={opacity}
          suffix="%"
          onPointerDown={() => { prevOpacity.current = opacity }}
          onPointerUp={() => { if (opacity !== prevOpacity.current) pushSnapshot({ opacity: prevOpacity.current }) }}
          onChange={setOpacity}
        />
        <ToolRow>
          <div className="size-9 shrink-0 rounded-lg border border-[var(--color-outline-variant)] hover:border-[var(--color-outline)] transition-colors relative overflow-hidden" title={t('grid.color')}>
            <input
              type="color"
              aria-label={t('grid.color')}
              value={color}
              onFocus={() => { prevColor.current = color }}
              onBlur={() => { if (color !== prevColor.current) pushSnapshot({ color: prevColor.current }) }}
              onChange={(e) => setColor(e.target.value)}
              className="absolute inset-[-25%] size-[150%] cursor-pointer"
            />
          </div>
          <ToolButton
            variant="toggle"
            icon="tag"
            label={t('grid.numbers')}
            active={showNumbers}
            onClick={() => { pushSnapshot(); setShowNumbers((v) => !v); }}
            className="flex-1"
          />
        </ToolRow>
      </ToolCluster>

      <ToolPanelFooter>
        <SendActions
          isReturn={isReturn}
          busy={sending || !imageUrl}
          showGrid={false}
          onBack={onSend}
          onSendBoards={onSend}
          onExport={onExport}
        />
      </ToolPanelFooter>
    </>
  )
}
