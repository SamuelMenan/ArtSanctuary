'use client'

import { useEffect } from 'react'
import { motion } from 'motion/react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { scaleIn, transition } from '@frontend/shared/motion/tokens'

/** Filas de atajos: [combinación, clave i18n de descripción]. */
const ROWS: [string, string][] = [
  ['V', 'boards.scSelect'],
  ['H', 'boards.scHand'],
  ['M', 'boards.scMeasure'],
  ['Espacio', 'boards.scSpacePan'],
  ['Ctrl/⌘ + Z', 'boards.scUndo'],
  ['Ctrl/⌘ + Shift + Z', 'boards.scRedo'],
  ['Ctrl/⌘ + C / V', 'boards.scCopyPaste'],
  ['Ctrl/⌘ + D', 'boards.scDuplicate'],
  ['Alt + arrastrar', 'boards.scAltDrag'],
  ['↑ ↓ ← →', 'boards.scNudge'],
  ['Shift + ↑↓←→', 'boards.scNudgeBig'],
  ['Supr / Backspace', 'boards.scDelete'],
  ['Ctrl/⌘ + + / −', 'boards.scZoom'],
  ['Ctrl/⌘ + 0', 'boards.scZoomReset'],
  ['Shift + 1', 'boards.scZoomFit'],
  ['Shift + 2', 'boards.scZoomSel'],
  ['Rueda', 'boards.scWheelZoom'],
  ['Shift / Alt + Rueda', 'boards.scWheelPan'],
]

/** Panel modal con la lista de atajos del lienzo (tecla ?). */
export default function ShortcutsHelp({ onClose }: { onClose: () => void }) {
  const { t } = usePreferences()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sc-help-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={transition.fast}
    >
      <motion.div
        className="w-full max-w-md max-h-[80%] overflow-auto rounded-2xl bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] shadow-2xl p-5"
        variants={scaleIn}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="sc-help-title" className="font-sans font-semibold text-[var(--color-primary)] uppercase tracking-wide text-sm">
            {t('boards.shortcutsTitle')}
          </h2>
          <button
            onClick={onClose}
            aria-label={t('boards.closeTip')}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden>close</span>
          </button>
        </div>
        <dl className="space-y-1.5">
          {ROWS.map(([combo, key]) => (
            <div key={combo} className="flex items-center justify-between gap-4">
              <dt className="font-sans text-sm text-[var(--color-on-surface-variant)]">{t(key)}</dt>
              <dd className="font-mono text-[11px] text-[var(--color-on-surface)] bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)] rounded px-2 py-0.5 shrink-0">
                {combo}
              </dd>
            </div>
          ))}
        </dl>
      </motion.div>
    </motion.div>
  )
}
