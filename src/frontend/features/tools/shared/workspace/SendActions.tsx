'use client'

import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import ToolButton from './ToolButton'

/**
 * Acciones de salida unificadas, orden fijo: [Volver al tablero | Tableros]
 * [Cuadrícula*] [Exportar]. `showGrid=false` en la propia Cuadrícula. Se
 * reparten a lo ancho del panel y envuelven si no caben (sin scroll).
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
  const fill = 'flex-1 min-w-[72px]'
  return (
    <div className="flex flex-wrap items-center gap-2 w-full">
      {isReturn ? (
        <ToolButton
          variant="ghost"
          icon="undo"
          label={t('tools.board')}
          title={t('tools.backBoardTip')}
          disabled={busy}
          onClick={onBack}
          className={`${fill} !text-[var(--color-primary)] !border-[var(--color-primary)]`}
        />
      ) : (
        <ToolButton variant="ghost" icon="dashboard" label={t('tools.boards')} title={t('tools.sendBoards')} disabled={busy} onClick={onSendBoards} className={fill} />
      )}
      {showGrid && onSendGrid && (
        <ToolButton variant="ghost" icon="grid_on" label={t('tools.grid')} title={t('tools.sendGrid')} disabled={busy} onClick={onSendGrid} className={fill} />
      )}
      <ToolButton variant="action" icon="download" label={t('tools.export')} disabled={busy} onClick={onExport} className={fill} />
    </div>
  )
}
