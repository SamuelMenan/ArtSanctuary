import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { fadeSlide, transition } from '@frontend/shared/motion/tokens'
import { BoardObject } from '@shared/lib/boards/types'
import { island, islandSep, ISLAND } from './islandStyles'
import IconButton from './IconButton'
import Popover from './Popover'

const CM_PRESETS = [2, 50] as const
const round1 = (n: number) => Math.round(n * 10) / 10

/**
 * Rail derecho unificado en una sola columna con secciones de orden estable y
 * divisores hairline:
 *   1. Objeto seleccionado (contextual): bloquear, duplicar, z-order, editar, borrar.
 *   2. Lienzo: popover "Escala" (cuadrícula/imán/cm/presets).
 *   3. Capas: toggle del panel.
 *   4. Workspace (`workspaceSlot`): acciones de la extensión (p. ej. Acreditación).
 * Resuelve el amontonamiento y la colisión ACREDITAR ↔ Inspector.
 */
export default function RightRail({
  selectedIds,
  objects,
  selectedObj,
  backgroundType,
  squareCm,
  snap,
  layersOpen,
  readOnly,
  onToggleLock,
  onDuplicate,
  onBringToFront,
  onSendToBack,
  onEditIn,
  canMirrorLateral,
  onToggleObjectMirror,
  onToggleFlipX,
  onToggleFlipY,
  onToggleGridVisible,
  onClearGrid,
  onDelete,
  onToggleBackground,
  onToggleSnap,
  onSetSquareCm,
  onToggleLayers,
  onOpenImageTool,
  workspaceSlot,
  lateralMirrorEnabled,
  onToggleLateralMirror,
}: {
  selectedIds: string[]
  objects: BoardObject[]
  selectedObj: BoardObject | null | undefined
  backgroundType: string
  squareCm: number
  snap: boolean
  layersOpen: boolean
  readOnly: boolean
  onToggleLock: () => void
  onDuplicate: () => void
  onBringToFront: () => void
  onSendToBack: () => void
  onEditIn: (dest: 'crop' | 'grid') => void
  canMirrorLateral: boolean
  onToggleObjectMirror?: () => void
  /** Espejo lateral activo a nivel de tablero (`Board.lateralMirrorEnabled`). */
  lateralMirrorEnabled?: boolean
  onToggleLateralMirror?: () => void
  onToggleFlipX: () => void
  onToggleFlipY: () => void
  onToggleGridVisible: () => void
  onClearGrid: () => void
  onDelete: () => void
  onToggleBackground: () => void
  onToggleSnap: () => void
  onSetSquareCm: (n: number) => void
  onToggleLayers: () => void
  /** Abre el modal "Cuadrícula + PDF a escala" para la imagen seleccionada. */
  onOpenImageTool: () => void
  /** Acciones de la extensión del workspace (sección inferior). */
  workspaceSlot?: ReactNode
}) {
  const { t } = usePreferences()
  // En solo-lectura no hay edición; el rail solo existe si la extensión aporta acciones.
  if (readOnly && !workspaceSlot) return null

  const allLocked = selectedIds.every((id) => objects.find((o) => o.id === id)?.locked)
  const isGrid = backgroundType === 'grid'
  const hasSel = selectedIds.length > 0
  const selectionContainsImgs = selectedIds.some((id) => objects.find((o) => o.id === id)?.type === 'image')

  return (
    <motion.div
      layout
      className={`${island} right-4 top-4 flex flex-col ${ISLAND.gap} ${ISLAND.pad} ${ISLAND.islandRadius} items-center`}
      role="toolbar"
      aria-label={t('boards.inspectorGroup')}
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...transition.slow, delay: 0.06 }}
    >
      {!readOnly && (
        <>
          {/* 1 · Objeto seleccionado (contextual): aparece/desaparece según selección */}
          <AnimatePresence>
            {hasSel && (
              <motion.div
                layout
                variants={fadeSlide}
                initial="initial"
                animate="animate"
                exit="exit"
                className={`flex flex-col ${ISLAND.gap} items-center`}
              >
                <IconButton
                  icon={allLocked ? 'lock' : 'lock_open'}
                  label={allLocked ? t('boards.unlockTip') : t('boards.lockTip')}
                  active={allLocked}
                  pressed={allLocked}
                  onClick={onToggleLock}
                />
                <IconButton icon="content_copy" label={t('boards.duplicateTip')} onClick={onDuplicate} />
                <IconButton icon="flip_to_front" label={t('boards.bringToFrontTip')} onClick={onBringToFront} />
                <IconButton icon="flip_to_back" label={t('boards.sendToBackTip')} onClick={onSendToBack} />
                {selectionContainsImgs && (
                  <>
                    <IconButton
                      icon="swap_horiz"
                      label={t('crop.flipHorizontal')}
                      active={!!selectedObj?.flipX}
                      onClick={onToggleFlipX}
                    />
                    <IconButton
                      icon="swap_vert"
                      label={t('crop.flipVertical')}
                      active={!!selectedObj?.flipY}
                      onClick={onToggleFlipY}
                    />
                  </>
                )}
                {selectedObj?.type === 'image' && (
                  <>
                    {canMirrorLateral && onToggleObjectMirror && (
                      <IconButton
                        icon="compare_arrows"
                        label={t('boards.lateralMirrorToggle')}
                        title={selectedObj?.lateralMirror ? t('boards.lateralMirrorOn') : t('boards.lateralMirrorOff')}
                        active={selectedObj?.lateralMirror}
                        pressed={selectedObj?.lateralMirror}
                        onClick={onToggleObjectMirror}
                      />
                    )}
                    <IconButton icon="crop" label={t('boards.editCropTip')} onClick={() => onEditIn('crop')} />
                    <IconButton
                      icon={selectedObj.gridVisible === false ? 'visibility_off' : 'visibility'}
                      label={selectedObj.gridVisible === false ? t('boards.showGridTip') : t('boards.hideGridTip')}
                      active={selectedObj.gridCm != null && selectedObj.gridCm > 0 && selectedObj.gridVisible !== false}
                      pressed={selectedObj.gridCm != null && selectedObj.gridCm > 0 && selectedObj.gridVisible !== false}
                      disabled={!(selectedObj.gridCm && selectedObj.gridCm > 0)}
                      onClick={onToggleGridVisible}
                    />
                    <IconButton
                      icon="grid_off"
                      label={t('boards.clearGridTip')}
                      disabled={!(selectedObj.gridCm && selectedObj.gridCm > 0)}
                      onClick={onClearGrid}
                    />
                    <IconButton icon="download" label={t('boards.imageToolTip')} onClick={onOpenImageTool} />
                  </>
                )}
                <IconButton icon="delete" label={t('boards.deleteTip')} danger onClick={onDelete} />
                <span className={islandSep} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* 2 · Lienzo: escala/cuadrícula en popover (elimina el desborde) */}
          <Popover icon="square_foot" label={t('boards.scaleTip')} active={isGrid}>
            <ScaleControls
              isGrid={isGrid}
              snap={snap}
              squareCm={squareCm}
              onToggleBackground={onToggleBackground}
              onToggleSnap={onToggleSnap}
              onSetSquareCm={onSetSquareCm}
            />
          </Popover>

          {/* Espejo lateral a nivel de TABLERO (distinto del toggle por objeto,
              que vive en la sección de objeto seleccionado). Solo en el plano
              lateral derecho, que es el único origen del espejo. */}
          {canMirrorLateral && onToggleLateralMirror && (
            <IconButton
              icon="flip"
              label={t('boards.lateralMirrorToggle')}
              active={lateralMirrorEnabled}
              pressed={lateralMirrorEnabled}
              onClick={onToggleLateralMirror}
            />
          )}

          {/* 3 · Capas */}
          <span className={islandSep} />
          <IconButton
            icon="layers"
            label={t('boards.layersTip')}
            active={layersOpen}
            pressed={layersOpen}
            onClick={onToggleLayers}
          />
        </>
      )}

      {/* 4 · Workspace (extensión): ACREDITAR u otras acciones del tipo */}
      {workspaceSlot && (
        <>
          {!readOnly && <span className={islandSep} />}
          {workspaceSlot}
        </>
      )}
    </motion.div>
  )
}

/** Contenido del popover de escala: cuadrícula, imán y cm/cuadro con presets. */
function ScaleControls({
  isGrid,
  snap,
  squareCm,
  onToggleBackground,
  onToggleSnap,
  onSetSquareCm,
}: {
  isGrid: boolean
  snap: boolean
  squareCm: number
  onToggleBackground: () => void
  onToggleSnap: () => void
  onSetSquareCm: (n: number) => void
}) {
  const { t } = usePreferences()
  const row =
    'flex items-center justify-between gap-3 h-9 px-2.5 rounded-lg text-[12px] font-sans transition-colors disabled:opacity-40'
  const rowOn = 'bg-[var(--color-primary)]/12 text-[var(--color-primary)]'
  const rowOff = 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]'

  return (
    <div className="flex flex-col gap-1 w-44 bg-[var(--color-surface-container-low)] rounded-lg p-1.5">
      <button
        type="button"
        onClick={onToggleBackground}
        aria-pressed={isGrid}
        className={`${row} ${isGrid ? rowOn : rowOff}`}
      >
        <span>{t('boards.gridRow')}</span>
        <span className="material-symbols-outlined text-[18px]" aria-hidden>
          {isGrid ? 'toggle_on' : 'toggle_off'}
        </span>
      </button>

      <button
        type="button"
        onClick={onToggleSnap}
        disabled={!isGrid}
        aria-pressed={snap && isGrid}
        className={`${row} ${snap && isGrid ? rowOn : rowOff}`}
      >
        <span>{t('boards.snapRow')}</span>
        <span className="material-symbols-outlined text-[18px]" aria-hidden>
          {snap && isGrid ? 'toggle_on' : 'toggle_off'}
        </span>
      </button>

      {isGrid && (
        <div className="flex items-center gap-1 px-1 pt-1">
          <span className="text-[11px] text-[var(--color-on-surface-variant)] flex-1">{t('boards.cmPerSquare')}</span>
          <input
            type="number"
            min={0.1}
            step={0.5}
            value={round1(squareCm)}
            onChange={(e) => onSetSquareCm(Number(e.target.value))}
            aria-label={t('boards.cmPerSquare')}
            className="w-12 h-8 bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] rounded-md px-1 font-mono text-[11px] text-center text-[var(--color-on-surface)] outline-none focus:border-[var(--color-primary)]"
          />
        </div>
      )}

      {isGrid && (
        <div className="flex items-center gap-1 px-1">
          {CM_PRESETS.map((preset) => {
            const on = Math.abs(squareCm - preset) < 0.01
            return (
              <button
                key={preset}
                type="button"
                onClick={() => onSetSquareCm(preset)}
                title={t('boards.useCmTip', { n: preset })}
                className={`flex-1 h-8 rounded-md border text-[10px] font-semibold transition-colors ${
                  on
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/10'
                    : 'border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
                }`}
              >
                {preset} cm
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
