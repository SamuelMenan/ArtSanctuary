'use client'

import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import ToolButton from './ToolButton'

/**
 * Acciones de salida unificadas, orden fijo: [Volver al tablero | Tableros]
 * [Cuadrícula*] [Exportar]. `showGrid=false` en la propia Cuadrícula.
 */
export default function SendActions({
  isReturn,
  busy = false,
  showGrid = true,
  onBack,
  onSendBoards,
  onSendGrid,
  onExport,
}: {
  isReturn: boolean
  busy?: boolean
  showGrid?: boolean
  onBack?: () => void
  onSendBoards: () => void
  onSendGrid?: () => void
  onExport: () => void
}) {
  const { t } = usePreferences()
  return (
    <>
      {isReturn ? (
        <ToolButton
          variant="ghost"
          icon="undo"
          label={t('tools.board')}
          title={t('tools.backBoardTip')}
          disabled={busy}
          onClick={onBack}
          className="!text-[var(--color-primary)] !border-[var(--color-primary)]"
        />
      ) : (
        <ToolButton variant="ghost" icon="dashboard" label={t('tools.boards')} title={t('tools.sendBoards')} disabled={busy} onClick={onSendBoards} />
      )}
      {showGrid && onSendGrid && (
        <ToolButton variant="ghost" icon="grid_on" title={t('tools.sendGrid')} disabled={busy} onClick={onSendGrid} />
      )}
      <ToolButton variant="action" icon="download" label={t('tools.export')} disabled={busy} onClick={onExport} />
    </>
  )
}
