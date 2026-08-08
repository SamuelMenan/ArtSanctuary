'use client'

import { motion } from 'motion/react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { transition } from '@frontend/shared/motion/tokens'
import AppBarButton from '@frontend/shared/layouts/appbar/AppBarButton'
import { appBarShellSecondary, appBarBg, appBarLabel } from '@frontend/shared/layouts/appbar/appBarStyles'

/** Divisor vertical hairline entre grupos de la barra superior. */
const vsep = 'w-px h-6 bg-[var(--color-outline-variant)] mx-1 shrink-0'

/** Barra superior del board: volver, nombre editable, estado de guardado y undo/redo. */
export default function TopBar({
  name,
  onName,
  readOnly,
  saveState,
  onUndo,
  onRedo,
  backHref,
}: {
  name: string
  onName: (v: string) => void
  readOnly: boolean
  saveState: 'idle' | 'saving' | 'saved'
  onUndo: () => void
  onRedo: () => void
  /** Destino del botón "volver": workspace si es plano Carnaval, lista de tableros si no. */
  backHref: string
}) {
  const { t } = usePreferences()
  return (
    <motion.div
      // Barra de tool sobre lienzo → superficie sólida (más contraste); el resto
      className={`${appBarShellSecondary} ${appBarBg.solid} gap-3`}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition.slow}
    >
      <AppBarButton icon="arrow_back" label={t('boards.backTip')} href={backHref} />
      <input
        value={name}
        onChange={(e) => onName(e.target.value)}
        disabled={readOnly}
        aria-label={t('boards.nameLabel')}
        className="bg-transparent font-sans font-semibold text-[var(--color-primary)] border-b border-transparent hover:border-[var(--color-outline-variant)] focus:border-[var(--color-primary)] outline-none px-1 py-0.5 min-w-[120px] max-w-[320px]"
      />
      <div className="flex-1" />
      <span role="status" aria-live="polite" className={`${appBarLabel} shrink-0`}>
        {readOnly ? t('boards.readOnly') : saveState === 'saving' ? t('boards.saving') : saveState === 'saved' ? t('boards.saved') : ''}
      </span>
      {!readOnly && (
        <>
          <span className={vsep} />
          <div className="flex items-center gap-1">
            <AppBarButton icon="undo" label={t('boards.undoTip')} onClick={onUndo} />
            <AppBarButton icon="redo" label={t('boards.redoTip')} onClick={onRedo} />
          </div>
        </>
      )}
    </motion.div>
  )
}
