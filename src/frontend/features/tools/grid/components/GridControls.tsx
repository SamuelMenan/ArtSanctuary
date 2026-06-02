'use client'

import type { RefObject, Dispatch, SetStateAction } from 'react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import type { GridSnapshot } from '../hooks/useGridHistory'

const CM_PRESETS = [1.5, 28] as const
const lbl = 'font-mono text-[10px] text-[var(--color-on-surface-variant)] uppercase tracking-[0.08em]'
const numInput =
  'w-12 bg-transparent border-0 border-b border-[var(--color-outline-variant)] px-0.5 py-0.5 font-mono text-label-sm text-[var(--color-primary)] text-center focus:border-[var(--color-primary)] outline-none'

// Agrupa controles relacionados en un contenedor con etiqueta.
const Cluster = ({ name, children }: { name: string; children: React.ReactNode }) => (
  <div className="flex items-center gap-3 px-3 h-10 rounded-lg bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/60 shrink-0">
    <span className="font-mono text-[9px] text-[var(--color-on-surface-variant)]/70 uppercase tracking-[0.12em] hidden xl:inline">{name}</span>
    {children}
  </div>
)

/** Barra superior de la cuadrícula: foto, historial, medidas, estilo y acciones. */
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
    <div className="bg-[var(--color-surface-container)] border-b border-[var(--color-outline-variant)] shrink-0 px-[var(--spacing-grid-gutter)] py-2.5 flex items-center gap-3 overflow-x-auto whitespace-nowrap">
      <button onClick={onChangePhoto} className="flex items-center gap-2 h-10 px-4 rounded-lg border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] font-mono text-label-sm font-semibold transition-colors">
        <span className="material-symbols-outlined text-[18px]">imagesmode</span>
        {t('grid.changePhoto')}
      </button>

      <span className="w-px h-6 bg-[var(--color-outline-variant)]/60" />

      <button onClick={onUndo} disabled={!canUndo} className="flex items-center justify-center w-10 h-10 rounded-lg border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors shrink-0 disabled:opacity-40" title={t('grid.undoTip')}>
        <span className="material-symbols-outlined text-[20px]">undo</span>
      </button>
      <button onClick={onRedo} disabled={!canRedo} className="flex items-center justify-center w-10 h-10 rounded-lg border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors shrink-0 disabled:opacity-40" title={t('grid.redoTip')}>
        <span className="material-symbols-outlined text-[20px]">redo</span>
      </button>

      <span className="w-px h-6 bg-[var(--color-outline-variant)]/60" />

      {/* Medidas */}
      <Cluster name={t('grid.measures')}>
        <label className="flex items-center gap-1">
          <span className={lbl}>{t('grid.width')}</span>
          <button
            type="button"
            onClick={() => { pushSnapshot(); setRealWidthCm((w) => snapMul(w - squareCm)); }}
            className="material-symbols-outlined text-[16px] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] leading-none"
            aria-label={t('grid.minusSquareTip')}
          >remove</button>
          <input
            type="number" min={squareCm} step={squareCm} value={realWidthCm}
            onFocus={() => pushSnapshot()}
            onChange={(e) => setRealWidthCm(Number(e.target.value))}
            onBlur={(e) => setRealWidthCm(snapMul(Number(e.target.value)))}
            className={numInput}
          />
          <button
            type="button"
            onClick={() => { pushSnapshot(); setRealWidthCm((w) => snapMul(w + squareCm)); }}
            className="material-symbols-outlined text-[16px] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] leading-none"
            aria-label={t('grid.plusSquareTip')}
          >add</button>
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
      </Cluster>

      {/* Estilo */}
      <Cluster name={t('grid.style')}>
        <span className="material-symbols-outlined text-[16px] text-[var(--color-on-surface-variant)]">opacity</span>
        <input className="w-20 custom-range" max="100" min="0" type="range" value={opacity}
          onPointerDown={() => { prevOpacity.current = opacity }}
          onPointerUp={() => { if (opacity !== prevOpacity.current) pushSnapshot({ opacity: prevOpacity.current }) }}
          onChange={(e) => setOpacity(Number(e.target.value))}
        />
        <span className="font-mono text-[10px] text-[var(--color-primary)] w-7 text-right">{opacity}%</span>
        <span className="w-px h-4 bg-[var(--color-outline-variant)]/60" />
        <div className="w-5 h-5 rounded-sm border border-[var(--color-outline-variant)] hover:border-[var(--color-primary)] transition-colors relative overflow-hidden">
          <input type="color" value={color}
            onFocus={() => { prevColor.current = color }}
            onBlur={() => { if (color !== prevColor.current) pushSnapshot({ color: prevColor.current }) }}
            onChange={(e) => setColor(e.target.value)}
            className="absolute inset-[-10px] w-10 h-10 cursor-pointer"
          />
        </div>
        <span className="w-px h-4 bg-[var(--color-outline-variant)]/60" />
        <button
          onClick={() => { pushSnapshot(); setShowNumbers((v) => !v); }}
          aria-pressed={showNumbers}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md font-mono text-[10px] uppercase tracking-[0.08em] transition-colors ${
            showNumbers ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">tag</span>
          {t('grid.numbers')}
        </button>
      </Cluster>

      <div className="flex-1" />

      {/* Acciones */}
      <button
        onClick={onReset}
        disabled={!imageUrl}
        className="flex items-center justify-center w-10 h-10 rounded-lg border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors shrink-0 disabled:opacity-40"
        title={t('grid.centerTip')}
      >
        <span className="material-symbols-outlined text-[20px]">recenter</span>
      </button>
      <button
        onClick={onSend}
        disabled={!imageUrl || sending}
        className={`flex items-center gap-2 h-10 px-4 rounded-lg border border-[var(--color-outline)] font-mono text-label-sm font-semibold shrink-0 disabled:opacity-40 hover:opacity-90 transition-opacity ${
          isReturn
            ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
            : 'bg-[var(--color-surface-container-high)] text-[var(--color-primary)]'
        }`}
        title={isReturn ? t('grid.backBoardTip') : t('grid.sendBoardsTip')}
      >
        <span className="material-symbols-outlined text-[18px]">{isReturn ? 'undo' : 'dashboard'}</span>
        {isReturn ? t('grid.board') : t('grid.boards')}
      </button>
      <button
        onClick={onExport}
        disabled={!imageUrl}
        className="flex items-center gap-2 h-10 px-4 rounded-lg bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] border border-[var(--color-outline)] shadow-[0_1px_0_var(--color-outline)] font-mono text-label-sm font-semibold shrink-0 disabled:opacity-40 hover:opacity-90 transition-opacity"
      >
        <span className="material-symbols-outlined text-[18px]">download</span>
        {t('grid.export')}
      </button>
    </div>
  )
}
