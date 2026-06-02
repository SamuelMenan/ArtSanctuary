'use client'

import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import ToolButton from './ToolButton'

/** Undo/redo unificados. Las 3 herramientas deben tener historial (paridad). */
export default function HistoryButtons({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: {
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
}) {
  const { t } = usePreferences()
  return (
    <>
      <ToolButton variant="icon" icon="undo" title={t('tools.undoTip')} disabled={!canUndo} onClick={onUndo} />
      <ToolButton variant="icon" icon="redo" title={t('tools.redoTip')} disabled={!canRedo} onClick={onRedo} />
    </>
  )
}
