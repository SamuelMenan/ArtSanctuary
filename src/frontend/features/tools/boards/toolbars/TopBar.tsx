import Link from 'next/link'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'

const iconBtn =
  'flex items-center justify-center w-10 h-10 rounded-lg border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors shrink-0 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]'

/** Barra superior del board: volver, nombre editable, estado de guardado, undo/redo y descarga. */
export default function TopBar({
  name,
  onName,
  readOnly,
  saveState,
  onUndo,
  onRedo,
  onDownload,
  backHref,
}: {
  name: string
  onName: (v: string) => void
  readOnly: boolean
  saveState: 'idle' | 'saving' | 'saved'
  onUndo: () => void
  onRedo: () => void
  onDownload: () => void
  /** Destino del botón "volver": workspace si es plano Carnaval, lista de tableros si no. */
  backHref: string
}) {
  const { t } = usePreferences()
  return (
    <div className="bg-[var(--color-surface-container)] border-b border-[var(--color-outline-variant)] shrink-0 px-4 py-2 flex items-center gap-3">
      <Link href={backHref} className={iconBtn} title={t('boards.backTip')} aria-label={t('boards.backTip')}>
        <span className="material-symbols-outlined text-[20px]" aria-hidden>arrow_back</span>
      </Link>
      <input
        value={name}
        onChange={(e) => onName(e.target.value)}
        disabled={readOnly}
        aria-label={t('boards.nameLabel')}
        className="bg-transparent font-sans font-semibold text-[var(--color-primary)] border-b border-transparent hover:border-[var(--color-outline-variant)] focus:border-[var(--color-primary)] outline-none px-1 py-0.5 min-w-[120px] max-w-[320px]"
      />
      <div className="flex-1" />
      <span role="status" aria-live="polite" className="font-mono text-[10px] text-[var(--color-on-surface-variant)] shrink-0">
        {readOnly ? t('boards.readOnly') : saveState === 'saving' ? t('boards.saving') : saveState === 'saved' ? t('boards.saved') : ''}
      </span>
      {!readOnly && (
        <>
          <button onClick={onUndo} className={iconBtn} title={t('boards.undoTip')} aria-label={t('boards.undoTip')}>
            <span className="material-symbols-outlined text-[20px]" aria-hidden>undo</span>
          </button>
          <button onClick={onRedo} className={iconBtn} title={t('boards.redoTip')} aria-label={t('boards.redoTip')}>
            <span className="material-symbols-outlined text-[20px]" aria-hidden>redo</span>
          </button>
        </>
      )}
      <button onClick={onDownload} className={iconBtn} title={t('boards.downloadTip')} aria-label={t('boards.downloadTip')}>
        <span className="material-symbols-outlined text-[20px]" aria-hidden>download</span>
      </button>
    </div>
  )
}
