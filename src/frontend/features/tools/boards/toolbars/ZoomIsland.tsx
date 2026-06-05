'use client'

import { motion } from 'motion/react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { transition } from '@frontend/shared/motion/tokens'
import { island, ISLAND } from './islandStyles'
import IconButton from './IconButton'

/** Isla inferior izquierda: controles de vista (alejar, % / centrar, acercar). */
export default function ZoomIsland({
  scale,
  shiftRight,
  onZoomIn,
  onZoomOut,
  onReset,
  onZoomToFit,
}: {
  scale: number
  /** Desplaza la isla al centro para dejar sitio a la flecha de reapertura. */
  shiftRight?: boolean
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  onZoomToFit: () => void
}) {
  const { t } = usePreferences()
  const pct = Math.round(scale * 100)
  return (
    <motion.div
      className={`${island} left-4 bottom-4 flex items-center gap-0.5 p-1 ${ISLAND.pillRadius}`}
      role="group"
      aria-label={t('boards.zoomGroup')}
      initial={{ opacity: 0, y: 8, x: 0 }}
      animate={{ opacity: 1, y: 0, x: shiftRight ? 32 : 0 }}
      transition={transition.base}
    >
      <IconButton icon="remove" label={t('boards.minusTip')} onClick={onZoomOut} />
      <motion.button
        onClick={onReset}
        title={t('boards.resetZoom')}
        aria-label={t('boards.resetZoom')}
        whileTap={{ scale: 0.96 }}
        className="font-mono text-[11px] text-[var(--color-on-surface)] px-2 h-10 min-w-[48px] hover:text-[var(--color-primary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-lg"
      >
        {/* Micro "tick" del número al cambiar el zoom (confirma el cambio) */}
        <motion.span key={pct} initial={{ scale: 1.12 }} animate={{ scale: 1 }} transition={transition.fast} className="inline-block">
          {pct}%
        </motion.span>
      </motion.button>
      <IconButton icon="add" label={t('boards.plusTip')} onClick={onZoomIn} />
      <IconButton icon="fit_screen" label={t('boards.fitTip')} onClick={onZoomToFit} />
    </motion.div>
  )
}
