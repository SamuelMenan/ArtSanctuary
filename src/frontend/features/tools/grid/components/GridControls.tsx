'use client'

import type { RefObject, Dispatch, SetStateAction } from 'react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import ToolToolbar, { ToolDivider, ToolSpacer } from '@frontend/features/tools/shared/workspace/ToolToolbar'
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

/** Barra superior de la cuadrícula sobre las primitivas workspace (sin scroll). */
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
  onSend: () => void
  onExport: () => void
}) {
  const { t } = usePreferences()
  return (
    <ToolToolbar>
      <SourceButton onClick={onChangePhoto} />
      <ToolDivider />
      <HistoryButtons canUndo={canUndo} canRedo={canRedo} onUndo={onUndo} onRedo={onRedo} />
      <ToolDivider />

      <ToolCluster name={t('grid.measures')}>
        <label className="flex items-center gap-1">
          <span className={lbl}>{t('grid.width')}</span>
          <button type="button" onClick={() => { pushSnapshot(); setRealWidthCm((w) => snapMul(w - squareCm)); }} className={stepBtn} aria-label={t('grid.minusSquareTip')}>remove</button>
          <input
            type="number" min={squareCm} step={squareCm} value={realWidthCm}
            onFocus={() => pushSnapshot()}
            onChange={(e) => setRealWidthCm(Number(e.target.value))}
            onBlur={(e) => setRealWidthCm(snapMul(Number(e.target.value)))}
            className={numInput}
          />
          <button type="button" onClick={() => { pushSnapshot(); setRealWidthCm((w) => snapMul(w + squareCm)); }} className={stepBtn} aria-label={t('grid.plusSquareTip')}>add</button>
          <span className={lbl}>cm</span>
        </label>
        <span className="w-px h-4 bg-[var(--color-outline-variant)]/60" />
        <label className="flex items-center gap-1.5">
          <span className={lbl}>{t('grid.square')}</span>
          <input type="number" min={0.1} step={0.5} value={squareCm} onFocus={() => pushSnapshot()} onChange={(e) => setSquareCm(Math.max(0.1, Number(e.target.value)))} className={numInput} />
          <div className="flex items-center gap-1">
            {CM_PRESETS.map((preset) => {
              const active = Math.abs(squareCm - preset) < 0.01
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => { pushSnapshot(); setSquareCm(preset) }}
                  title={t('grid.usePreset', { n: preset })}
                  className={`h-8 px-2 rounded-md border text-[10px] font-semibold transition-colors ${active ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'}`}
                >
                  {preset} cm
                </button>
              )
            })}
          </div>
          <span className={lbl}>cm</span>
        </label>
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
        <span className="w-px h-4 bg-[var(--color-outline-variant)]/60" />
        <div className="w-5 h-5 rounded-sm border border-[var(--color-outline-variant)] hover:border-[var(--color-primary)] transition-colors relative overflow-hidden">
          <input
            type="color"
            value={color}
            onFocus={() => { prevColor.current = color }}
            onBlur={() => { if (color !== prevColor.current) pushSnapshot({ color: prevColor.current }) }}
            onChange={(e) => setColor(e.target.value)}
            className="absolute inset-[-10px] w-10 h-10 cursor-pointer"
          />
        </div>
        <span className="w-px h-4 bg-[var(--color-outline-variant)]/60" />
        <ToolButton
          variant="toggle"
          icon="tag"
          label={t('grid.numbers')}
          active={showNumbers}
          onClick={() => { pushSnapshot(); setShowNumbers((v) => !v); }}
        />
      </ToolCluster>

      <ToolSpacer />

      <ToolButton variant="icon" icon="recenter" title={t('grid.centerTip')} disabled={!imageUrl} onClick={onReset} />
      <SendActions
        isReturn={isReturn}
        busy={sending || !imageUrl}
        showGrid={false}
        onBack={onSend}
        onSendBoards={onSend}
        onExport={onExport}
      />
    </ToolToolbar>
  )
}
