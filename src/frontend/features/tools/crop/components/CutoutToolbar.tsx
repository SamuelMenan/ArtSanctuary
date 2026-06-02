'use client'

import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import ToolToolbar, { ToolDivider, ToolSpacer } from '@frontend/features/tools/shared/workspace/ToolToolbar'
import ToolCluster from '@frontend/features/tools/shared/workspace/ToolCluster'
import ToolButton from '@frontend/features/tools/shared/workspace/ToolButton'
import ToolSlider from '@frontend/features/tools/shared/workspace/ToolSlider'
import ToolSelect from '@frontend/features/tools/shared/workspace/ToolSelect'
import SourceButton from '@frontend/features/tools/shared/workspace/SourceButton'
import HistoryButtons from '@frontend/features/tools/shared/workspace/HistoryButtons'
import SendActions from '@frontend/features/tools/shared/workspace/SendActions'
import type { CutoutEditor } from '@frontend/features/tools/crop/useCutoutEditor'

/** Barra superior del recortador sobre las primitivas workspace (sin scroll). */
export default function CutoutToolbar({ editor }: { editor: CutoutEditor }) {
  const { t } = usePreferences()
  const {
    setModalOpen, undo, redo, pastData, futureData,
    ready, aiModel, setAiModel, aiRescale, setAiRescale,
    removeBgAI, busy, toolMode, setToolMode,
    tolerance, setTolerance, brushSize, setBrushSize,
    autoTrim, status, back, sendTo, exportPng,
  } = editor

  return (
    <ToolToolbar>
      <SourceButton onClick={() => setModalOpen(true)} />
      <ToolDivider />
      <HistoryButtons
        canUndo={pastData.current.length > 0}
        canRedo={futureData.current.length > 0}
        onUndo={undo}
        onRedo={redo}
      />

      {ready && (
        <>
          <ToolDivider />

          <ToolCluster name="IA">
            <ToolSelect
              value={aiModel}
              onChange={(v) => setAiModel(v)}
              options={[
                { value: 'isnet', label: t('crop.modelBest') },
                { value: 'isnet_fp16', label: t('crop.modelFp16') },
              ]}
            />
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={!aiRescale} onChange={(e) => setAiRescale(!e.target.checked)} className="accent-[var(--color-primary)] cursor-pointer" />
              <span className="font-mono text-[10px] uppercase text-[var(--color-on-surface-variant)]">{t('crop.resOriginal')}</span>
            </label>
            <ToolButton
              variant="action"
              icon={busy ? 'hourglass_top' : 'auto_fix_high'}
              label={t('crop.removeBgAI')}
              disabled={busy}
              onClick={removeBgAI}
            />
          </ToolCluster>

          <ToolCluster name={t('crop.tabCrop')}>
            <ToolButton variant="toggle" icon="colorize" label={t('crop.wand')} title={t('crop.wandTip')} active={toolMode === 'wand'} onClick={() => setToolMode((v) => (v === 'wand' ? null : 'wand'))} />
            <ToolButton variant="toggle" icon="ink_eraser" label={t('crop.erase')} title={t('crop.eraseTip')} active={toolMode === 'erase'} onClick={() => setToolMode((v) => (v === 'erase' ? null : 'erase'))} />
            <ToolButton variant="toggle" icon="brush" label={t('crop.restore')} title={t('crop.restoreTip')} active={toolMode === 'restore'} onClick={() => setToolMode((v) => (v === 'restore' ? null : 'restore'))} />
            {toolMode === 'wand' && (
              <ToolSlider icon="tune" min={0} max={120} value={tolerance} title={t('crop.toleranceTip')} onChange={setTolerance} />
            )}
            {(toolMode === 'erase' || toolMode === 'restore') && (
              <ToolSlider icon="line_weight" min={5} max={200} value={brushSize} suffix="px" title={t('crop.brushTip')} onChange={setBrushSize} />
            )}
          </ToolCluster>

          <ToolButton variant="ghost" icon="crop_free" label={t('crop.trim')} title={t('crop.trimTip')} onClick={autoTrim} />

          <ToolSpacer />

          {status && <span className="font-mono text-[10px] text-[var(--color-on-surface-variant)] shrink-0">{status}</span>}
          <SendActions
            isReturn={!!back.current?.boardId}
            busy={busy}
            onBack={() => sendTo('back')}
            onSendBoards={() => sendTo('boards')}
            onSendGrid={() => sendTo('grid')}
            onExport={exportPng}
          />
        </>
      )}
    </ToolToolbar>
  )
}
