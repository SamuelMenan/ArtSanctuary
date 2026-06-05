'use client'

import { motion } from 'motion/react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { transition } from '@frontend/shared/motion/tokens'
import { island, islandSep, ISLAND } from './islandStyles'
import IconButton from './IconButton'

type Tool = 'select' | 'hand' | 'measure'
type ShapeType = 'rect' | 'ellipse' | 'line' | 'arrow'

const MODES: { id: Tool; icon: string; tip: string }[] = [
  { id: 'select', icon: 'arrow_selector_tool', tip: 'selectTip' },
  { id: 'hand', icon: 'pan_tool', tip: 'moveBoardTip' },
  { id: 'measure', icon: 'straighten', tip: 'measureTip' },
]

/**
 * Isla izquierda: **modos** (select/hand/measure) como segmented control con
 * pastilla activa que se desliza (`layoutId`), separados por un divisor de las
 * acciones de **crear** (imagen/texto/nota/figuras), que son neutras.
 */
export default function ToolIsland({
  tool,
  shiftRight,
  onTool,
  onAddImage,
  onAddText,
  onAddSticky,
  onAddShape,
}: {
  tool: Tool
  /** Desplaza la isla al centro para dejar sitio a la flecha de reapertura. */
  shiftRight?: boolean
  onTool: (t: Tool) => void
  onAddImage: () => void
  onAddText: () => void
  onAddSticky: () => void
  onAddShape: (type: ShapeType) => void
}) {
  const { t } = usePreferences()
  // Base cómoda en left-4 (16px); +32px cuando hay que ceder espacio a la flecha.
  // El centrado vertical va por `y:'-50%'` (no clase) para no chocar con motion.
  return (
    <motion.div
      className={`${island} left-4 top-1/2 flex flex-col ${ISLAND.gap} ${ISLAND.pad} ${ISLAND.islandRadius}`}
      role="toolbar"
      aria-label={t('boards.toolsGroup')}
      initial={{ opacity: 0, x: -8, y: '-50%' }}
      animate={{ opacity: 1, x: shiftRight ? 32 : 0, y: '-50%' }}
      transition={transition.base}
    >
      {/* Modos: segmented control con pastilla deslizante sobre superficie hundida */}
      <div
        className="flex flex-col gap-0.5 p-0.5 rounded-2xl bg-[var(--color-surface-container-low)]"
        role="group"
        aria-label={t('boards.modesGroup')}
      >
        {MODES.map((m) => {
          const on = tool === m.id
          return (
            <motion.button
              key={m.id}
              type="button"
              onClick={() => onTool(m.id)}
              title={t(`boards.${m.tip}`)}
              aria-label={t(`boards.${m.tip}`)}
              aria-pressed={on}
              whileTap={{ scale: 0.96 }}
              className={`relative flex items-center justify-center ${ISLAND.btn} ${ISLAND.btnRadius} transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-surface-container)] ${
                on ? 'text-[var(--color-on-primary)]' : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]'
              }`}
            >
              {on && (
                <motion.span
                  layoutId="toolActivePill"
                  className={`absolute inset-0 ${ISLAND.btnRadius} bg-[var(--color-primary)] shadow-sm`}
                  transition={transition.base}
                />
              )}
              <span className="material-symbols-outlined text-[20px] relative z-10" aria-hidden>{m.icon}</span>
            </motion.button>
          )
        })}
      </div>

      <span className={`${islandSep} mx-auto`} />

      {/* Crear: acciones neutras */}
      <div className="flex flex-col gap-1" role="group" aria-label={t('boards.createGroup')}>
        <IconButton icon="add_photo_alternate" label={t('boards.addImageTip')} onClick={onAddImage} />
        <IconButton icon="title" label={t('boards.addTextTip')} onClick={onAddText} />
        <IconButton icon="sticky_note_2" label={t('boards.addNoteTip')} onClick={onAddSticky} />
        <IconButton icon="rectangle" label={t('boards.addRectTip')} onClick={() => onAddShape('rect')} />
        <IconButton icon="circle" label={t('boards.addEllipseTip')} onClick={() => onAddShape('ellipse')} />
        <IconButton icon="horizontal_rule" label={t('boards.addLineTip')} onClick={() => onAddShape('line')} />
        <IconButton icon="arrow_outward" label={t('boards.addArrowTip')} onClick={() => onAddShape('arrow')} />
      </div>
    </motion.div>
  )
}
