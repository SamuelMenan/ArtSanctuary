'use client'

import { motion } from 'motion/react'
import { popIn } from '@frontend/shared/motion/tokens'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import type { FactSource } from '@shared/lib/canon/anatomyFacts'

/** Badge discreto de procedencia (Vitruvio/Richer/Loomis/Bridgman/Antropometría).
 *  Aparece con `popIn` al revelar el dato; discreto, no distrae. */
export default function SourceBadge({ source }: { source: FactSource }) {
  const { t } = usePreferences()
  return (
    <motion.span
      variants={popIn}
      initial="initial"
      animate="animate"
      className="inline-flex w-fit items-center gap-1 rounded-full border border-[var(--color-outline-variant)]/70 px-1.5 py-px font-mono text-[9px] uppercase tracking-wider text-[var(--color-on-surface-variant)]"
    >
      <span className="material-symbols-outlined text-[11px] leading-none">menu_book</span>
      {t(`canon.help.sources.${source}`)}
    </motion.span>
  )
}
