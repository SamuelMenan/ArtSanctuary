'use client'

import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import ToolButton from './ToolButton'

/** Undo/redo unificados. Las 3 herramientas deben tener historial (paridad). */
export default function HistoryButtons({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  fill = false,
}: {
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  /** Reparte los botones a lo ancho de la fila (flex-1) en vez de tamaño fijo. */
  fill?: boolean
}) {
  const { t } = usePreferences()
  const cls = fill ? 'flex-1 min-w-0' : ''
  return (
    <>
      <ToolButton variant="icon" icon="undo" title={t('tools.undoTip')} disabled={!canUndo} onClick={onUndo} className={cls} />
      <ToolButton variant="icon" icon="redo" title={t('tools.redoTip')} disabled={!canRedo} onClick={onRedo} className={cls} />
    </>
  )
}
