'use client'

import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { ToolRow, ToolGrid, ToolPanelFooter } from '@frontend/features/tools/shared/workspace/ToolPanel'
import ToolCluster from '@frontend/features/tools/shared/workspace/ToolCluster'
import ToolButton from '@frontend/features/tools/shared/workspace/ToolButton'
import ToolSlider from '@frontend/features/tools/shared/workspace/ToolSlider'
import ToolSelect from '@frontend/features/tools/shared/workspace/ToolSelect'
import SourceButton from '@frontend/features/tools/shared/workspace/SourceButton'
import HistoryButtons from '@frontend/features/tools/shared/workspace/HistoryButtons'
import SendActions from '@frontend/features/tools/shared/workspace/SendActions'
import type { CutoutEditor } from '@frontend/features/tools/crop/useCutoutEditor'

/** Contenido del panel del recortador de fondo (vertical, sin scroll). Los
 *  controles se muestran de inmediato y se deshabilitan hasta cargar imagen. */
export default function CutoutToolbar({ editor }: { editor: CutoutEditor }) {
  const { t } = usePreferences()
  const {
    setModalOpen, undo, redo, pastData, futureData,
    ready, aiModel, setAiModel, aiRescale, setAiRescale,
    removeBgAI, busy, toolMode, setToolMode,
    tolerance, setTolerance, brushSize, setBrushSize,
    autoTrim, status, back, sendTo, exportPng,
  } = editor
  const off = !ready

  return (
    <>
      <SourceButton onClick={() => setModalOpen(true)} />
      <ToolRow>
        <HistoryButtons
          canUndo={pastData.current.length > 0}
          canRedo={futureData.current.length > 0}
          onUndo={undo}
          onRedo={redo}
        />
        <ToolButton variant="icon" icon="crop_free" title={t('crop.trimTip')} disabled={off} onClick={autoTrim} />
      </ToolRow>

      <ToolCluster name="IA">
        <ToolSelect
          value={aiModel}
          onChange={(v) => setAiModel(v)}
          className="w-full"
          options={[
            { value: 'isnet', label: t('crop.modelBest') },
            { value: 'isnet_fp16', label: t('crop.modelFp16') },
          ]}
        />
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={!aiRescale} disabled={off} onChange={(e) => setAiRescale(!e.target.checked)} className="accent-[var(--color-primary)] cursor-pointer" />
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-on-surface-variant)]">{t('crop.resOriginal')}</span>
        </label>
        <ToolButton
          variant="action"
          icon={busy ? 'hourglass_top' : 'auto_fix_high'}
          label={t('crop.removeBgAI')}
          disabled={off || busy}
          onClick={removeBgAI}
          className="w-full"
        />
      </ToolCluster>

      <ToolCluster name={t('crop.brushTools')}>
        <ToolGrid cols={3}>
          <ToolButton variant="toggle" stacked icon="colorize" label={t('crop.wand')} title={t('crop.wandTip')} active={toolMode === 'wand'} disabled={off} onClick={() => setToolMode((v) => (v === 'wand' ? null : 'wand'))} />
          <ToolButton variant="toggle" stacked icon="ink_eraser" label={t('crop.erase')} title={t('crop.eraseTip')} active={toolMode === 'erase'} disabled={off} onClick={() => setToolMode((v) => (v === 'erase' ? null : 'erase'))} />
          <ToolButton variant="toggle" stacked icon="brush" label={t('crop.restore')} title={t('crop.restoreTip')} active={toolMode === 'restore'} disabled={off} onClick={() => setToolMode((v) => (v === 'restore' ? null : 'restore'))} />
        </ToolGrid>
        {toolMode === 'wand' && (
          <ToolSlider icon="tune" min={0} max={120} value={tolerance} title={t('crop.toleranceTip')} onChange={setTolerance} />
        )}
        {(toolMode === 'erase' || toolMode === 'restore') && (
          <ToolSlider icon="line_weight" min={5} max={200} value={brushSize} suffix="px" title={t('crop.brushTip')} onChange={setBrushSize} />
        )}
      </ToolCluster>

      {status && <span className="font-mono text-[10px] text-[var(--color-on-surface-variant)] px-1">{status}</span>}

      <ToolPanelFooter>
        <SendActions
          isReturn={!!back.current?.boardId}
          busy={off || busy}
          onBack={() => sendTo('back')}
          onSendBoards={() => sendTo('boards')}
          onSendGrid={() => sendTo('grid')}
          onExport={exportPng}
        />
      </ToolPanelFooter>
    </>
  )
}
