'use client'

import { cmOf, formatCm, formatScaled } from '@shared/lib/measure'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import type { CutoutEditor } from '@frontend/features/tools/crop/useCutoutEditor'

const ctrlBtn =
  'flex items-center gap-2 h-10 px-3 rounded-lg border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors shrink-0 disabled:opacity-40 font-mono text-label-sm'

/** Barra superior del recortador: cambiar foto, historial, IA, herramientas y exportación. */
export default function CutoutToolbar({ editor }: { editor: CutoutEditor }) {
  const { t } = usePreferences()
  const {
    setModalOpen, undo, redo, pastData, futureData,
    ready, aiModel, setAiModel, aiRescale, setAiRescale,
    removeBgAI, busy, toolMode, setToolMode,
    tolerance, setTolerance, brushSize, setBrushSize,
    autoTrim, work, status, back, sendTo, exportPng,
  } = editor

  return (
    <div className="bg-[var(--color-surface-container)] border-b border-[var(--color-outline-variant)] shrink-0 px-4 py-2.5 flex items-center gap-3 overflow-x-auto whitespace-nowrap">
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 h-10 px-4 rounded-lg border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] font-mono text-label-sm font-semibold transition-colors">
          <span className="material-symbols-outlined text-[18px]">imagesmode</span>
          {t('crop.changePhoto')}
        </button>

        <span className="w-px h-6 bg-[var(--color-outline-variant)]/60" />

        <button onClick={undo} disabled={pastData.current.length === 0} className="flex items-center justify-center w-10 h-10 rounded-lg border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors shrink-0 disabled:opacity-40" title={t('crop.undoTip')}>
          <span className="material-symbols-outlined text-[20px]">undo</span>
        </button>
        <button onClick={redo} disabled={futureData.current.length === 0} className="flex items-center justify-center w-10 h-10 rounded-lg border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors shrink-0 disabled:opacity-40" title={t('crop.redoTip')}>
          <span className="material-symbols-outlined text-[20px]">redo</span>
        </button>
      {ready && (
        <>
          <span className="w-px h-6 bg-[var(--color-outline-variant)]/60" />
          <div className="flex items-center gap-2 bg-[var(--color-surface-container-low)] px-2 py-1 rounded border border-[var(--color-outline-variant)]/50">
            <span className="material-symbols-outlined text-[16px] text-[var(--color-on-surface-variant)]">memory</span>
            <select value={aiModel} onChange={(e) => setAiModel(e.target.value as 'isnet' | 'isnet_fp16')} className="bg-transparent text-label-sm font-mono text-[var(--color-on-surface)] outline-none cursor-pointer">
              <option value="isnet">{t('crop.modelBest')}</option>
              <option value="isnet_fp16">{t('crop.modelFp16')}</option>
            </select>
            <label className="flex items-center gap-1.5 ml-2 cursor-pointer border-l border-[var(--color-outline-variant)]/50 pl-3">
              <input type="checkbox" checked={!aiRescale} onChange={(e) => setAiRescale(!e.target.checked)} className="accent-[var(--color-primary)] cursor-pointer" />
              <span className="font-mono text-[10px] uppercase text-[var(--color-on-surface-variant)]">{t('crop.resOriginal')}</span>
            </label>
          </div>
          <button onClick={removeBgAI} disabled={busy} className="flex items-center gap-2 h-10 px-4 rounded-lg bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] font-mono text-label-sm font-semibold shrink-0 hover:opacity-90 disabled:opacity-40">
            <span className="material-symbols-outlined text-[18px]">{busy ? 'hourglass_top' : 'auto_fix_high'}</span>
            {t('crop.removeBgAI')}
          </button>
          <span className="w-px h-6 bg-[var(--color-outline-variant)]/60" />

          <button onClick={() => setToolMode((v) => (v === 'wand' ? null : 'wand'))} className={`${ctrlBtn} ${toolMode === 'wand' ? '!text-[var(--color-primary)] !border-[var(--color-primary)] bg-[var(--color-primary)]/10' : ''}`} title={t('crop.wandTip')}>
            <span className="material-symbols-outlined text-[18px]">colorize</span>
            {t('crop.wand')}
          </button>
          <button onClick={() => setToolMode((v) => (v === 'erase' ? null : 'erase'))} className={`${ctrlBtn} ${toolMode === 'erase' ? '!text-[var(--color-primary)] !border-[var(--color-primary)] bg-[var(--color-primary)]/10' : ''}`} title={t('crop.eraseTip')}>
            <span className="material-symbols-outlined text-[18px]">ink_eraser</span>
            {t('crop.erase')}
          </button>
          <button onClick={() => setToolMode((v) => (v === 'restore' ? null : 'restore'))} className={`${ctrlBtn} ${toolMode === 'restore' ? '!text-[var(--color-primary)] !border-[var(--color-primary)] bg-[var(--color-primary)]/10' : ''}`} title={t('crop.restoreTip')}>
            <span className="material-symbols-outlined text-[18px]">brush</span>
            {t('crop.restore')}
          </button>

          {toolMode === 'wand' && (
            <label className="flex items-center gap-1.5 shrink-0 bg-[var(--color-surface-container-low)] px-2 rounded border border-[var(--color-outline-variant)]/50" title={t('crop.toleranceTip')}>
              <span className="material-symbols-outlined text-[16px] text-[var(--color-on-surface-variant)]">tune</span>
              <input type="range" min={0} max={120} value={tolerance} onChange={(e) => setTolerance(Number(e.target.value))} className="w-20 custom-range" />
              <span className="font-mono text-[10px] text-[var(--color-primary)] w-6">{tolerance}</span>
            </label>
          )}

          {(toolMode === 'erase' || toolMode === 'restore') && (
            <label className="flex items-center gap-1.5 shrink-0 bg-[var(--color-surface-container-low)] px-2 rounded border border-[var(--color-outline-variant)]/50" title={t('crop.brushTip')}>
              <span className="material-symbols-outlined text-[16px] text-[var(--color-on-surface-variant)]">line_weight</span>
              <input type="range" min={5} max={200} value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-20 custom-range" />
              <span className="font-mono text-[10px] text-[var(--color-primary)] w-6">{brushSize}px</span>
            </label>
          )}

          <span className="w-px h-6 bg-[var(--color-outline-variant)]/60" />
          <button onClick={autoTrim} className={ctrlBtn} title={t('crop.trimTip')}>
            <span className="material-symbols-outlined text-[18px]">crop_free</span>
            {t('crop.trim')}
          </button>

          <div className="flex-1" />
          {work.current && (
            <div className="flex flex-col items-end gap-0.5">
              <span className="font-mono text-[10px] text-[var(--color-on-surface-variant)] shrink-0">{t('crop.reference')} · {formatCm(cmOf(work.current.width))} × {formatCm(cmOf(work.current.height))}</span>
              <span className="font-mono text-[10px] text-[var(--color-primary)] shrink-0">{t('crop.final')} · {formatScaled(cmOf(work.current.width))} × {formatScaled(cmOf(work.current.height))}</span>
            </div>
          )}
          {status && <span className="font-mono text-[10px] text-[var(--color-on-surface-variant)] shrink-0">{status}</span>}
          {back.current?.boardId ? (
            <button onClick={() => sendTo('back')} disabled={busy} className={`${ctrlBtn} !text-[var(--color-primary)] !border-[var(--color-primary)]`} title={t('crop.backBoardTip')}>
              <span className="material-symbols-outlined text-[18px]">undo</span>
              {t('crop.board')}
            </button>
          ) : (
            <button onClick={() => sendTo('boards')} disabled={busy} className={ctrlBtn} title={t('crop.sendBoards')}>
              <span className="material-symbols-outlined text-[18px]">dashboard</span>
              {t('crop.boards')}
            </button>
          )}
          <button onClick={() => sendTo('grid')} disabled={busy} className={ctrlBtn} title={t('crop.sendGrid')}>
            <span className="material-symbols-outlined text-[18px]">grid_on</span>
          </button>
          <button onClick={exportPng} disabled={busy} className="flex items-center gap-2 h-10 px-4 rounded-lg bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] font-mono text-label-sm font-semibold shrink-0 hover:opacity-90 disabled:opacity-40">
            <span className="material-symbols-outlined text-[18px]">download</span>
            {t('crop.exportPng')}
          </button>
        </>
      )}
    </div>
  )
}
