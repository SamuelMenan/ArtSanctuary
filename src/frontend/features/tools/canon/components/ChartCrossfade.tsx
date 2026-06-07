'use client'

import { AnimatePresence, motion } from 'motion/react'
import type { ReactNode } from 'react'
import { transition } from '@frontend/shared/motion/tokens'

/** Crossfade al cambiar `swapKey` (vista/canon). Mantiene la altura del contenedor. */
export default function ChartCrossfade({ swapKey, children }: { swapKey: string; children: ReactNode }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={swapKey}
        className="h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={transition.base}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
