'use client'

import { motion } from 'motion/react'
import { staggerParent } from '@frontend/shared/motion/tokens'
import RailButton from './RailButton'

const ITEMS = [
  { kind: 'png' as const, icon: 'image', label: 'PNG' },
  { kind: 'pdf' as const, icon: 'picture_as_pdf', label: 'PDF' },
  { kind: 'scale' as const, icon: 'straighten', label: '1:1' },
]

/**
 * Rail flotante VERTICAL (arriba-derecha del lienzo) con las exportaciones
 * PNG / PDF / 1:1: tres botones icono+etiqueta apilados, sin caja. El botón en
 * curso muestra reloj de arena.
 */
export default function CanonExportRail({
  exporting,
  onExport,
}: {
  exporting: null | 'png' | 'pdf' | 'scale'
  onExport: (kind: 'png' | 'pdf' | 'scale') => void
}) {
  return (
    <motion.div variants={staggerParent} initial="initial" animate="animate" className="absolute right-3 top-3 z-20 flex flex-col gap-1.5">
      {ITEMS.map((it) => (
        <RailButton
          key={it.kind}
          icon={exporting === it.kind ? 'hourglass_top' : it.icon}
          title={it.label}
          disabled={exporting !== null}
          onClick={() => onExport(it.kind)}
        />
      ))}
    </motion.div>
  )
}
