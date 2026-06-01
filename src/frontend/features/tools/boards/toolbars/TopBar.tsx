import Link from 'next/link'

const iconBtn =
  'flex items-center justify-center w-10 h-10 rounded-lg border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors shrink-0 disabled:opacity-40'

/** Barra superior del board: volver, nombre editable, estado de guardado, undo/redo y descarga. */
export default function TopBar({
  name,
  onName,
  readOnly,
  saveState,
  onUndo,
  onRedo,
  onDownload,
}: {
  name: string
  onName: (v: string) => void
  readOnly: boolean
  saveState: 'idle' | 'saving' | 'saved'
  onUndo: () => void
  onRedo: () => void
  onDownload: () => void
}) {
  return (
    <div className="bg-[var(--color-surface-container)] border-b border-[var(--color-outline-variant)] shrink-0 px-4 py-2 flex items-center gap-3">
      <Link href="/dashboard/boards" className={iconBtn} title="Volver al dashboard">
        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
      </Link>
      <input
        value={name}
        onChange={(e) => onName(e.target.value)}
        disabled={readOnly}
        className="bg-transparent font-sans font-semibold text-[var(--color-primary)] border-b border-transparent hover:border-[var(--color-outline-variant)] focus:border-[var(--color-primary)] outline-none px-1 py-0.5 min-w-[120px] max-w-[320px]"
      />
      <div className="flex-1" />
      <span className="font-mono text-[10px] text-[var(--color-on-surface-variant)] shrink-0">
        {readOnly ? 'Solo lectura' : saveState === 'saving' ? 'Guardando…' : saveState === 'saved' ? 'Guardado' : ''}
      </span>
      {!readOnly && (
        <>
          <button onClick={onUndo} className={iconBtn} title="Deshacer (Ctrl+Z)">
            <span className="material-symbols-outlined text-[20px]">undo</span>
          </button>
          <button onClick={onRedo} className={iconBtn} title="Rehacer (Ctrl+Shift+Z)">
            <span className="material-symbols-outlined text-[20px]">redo</span>
          </button>
        </>
      )}
      <button onClick={onDownload} className={iconBtn} title="Descargar como PNG">
        <span className="material-symbols-outlined text-[20px]">download</span>
      </button>
    </div>
  )
}
