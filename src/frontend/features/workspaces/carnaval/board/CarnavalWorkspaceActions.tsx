'use client'

// Acciones de workspace Carnaval para el rail derecho (solo boards Carnaval):
//  1. Toggle del Inspector de Acreditación (el panel lo renderiza CarnavalOverlays).
//  2. "Guía de tamaño": coloca otra copia IDÉNTICA de la guía reglamentaria de la
//     vista/modo actual (la que indica cuánto debe medir la carroza), desplazada a
//     la derecha, para diseñar varias alternativas en paralelo. La render la capa
//     Konva (CarnavalGuideLayer) reutilizando exactamente el mismo dibujo.

import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import IconButton from '@frontend/features/tools/boards/toolbars/IconButton'
import type { BoardExtSlotProps } from '@frontend/features/tools/boards/extensions/boardExtension'
import { getCarnavalRule } from '@shared/lib/workspaces/carnaval'
import { useCarnavalBoard } from './context'

export default function CarnavalWorkspaceActions({
  workspace,
  objects,
  selectedIds,
  patchSelected,
  lateralMirrorEnabled,
}: BoardExtSlotProps) {
  const { t } = usePreferences()
  const { inspectorOpen, setInspectorOpen, guideOffsets, addGuide, clearGuides } = useCarnavalBoard()
  const rule = workspace.modality ? getCarnavalRule(workspace.modality) : null
  if (!rule) return null

  const canMirrorLateral =
    lateralMirrorEnabled && workspace.kind === 'carnaval' && workspace.view === 'lateralDer'

  const hasSelection = selectedIds.length > 0
  const selectedObjects = selectedIds.map((id) => objects.find((o) => o.id === id)).filter(Boolean)
  const isMirror = hasSelection && selectedObjects.every((o) => o?.lateralMirror)

  const handleToggleMirror = () => {
    if (!hasSelection) return
    patchSelected({ lateralMirror: !isMirror })
  }

  return (
    <>
      <IconButton
        icon="fact_check"
        label={t('boards.inspectorTitle')}
        active={inspectorOpen}
        pressed={inspectorOpen}
        onClick={() => setInspectorOpen(!inspectorOpen)}
      />
      <IconButton icon="crop_free" label={t('boards.newGuide')} onClick={addGuide} />
      {guideOffsets.length > 0 && (
        <IconButton icon="layers_clear" label={t('boards.clearGuides')} onClick={clearGuides} />
      )}
      {canMirrorLateral && (
        <IconButton
          icon="compare_arrows"
          label={t('boards.lateralMirrorToggle')}
          title={isMirror ? t('boards.lateralMirrorOn') : t('boards.lateralMirrorOff')}
          active={isMirror}
          pressed={isMirror}
          disabled={!hasSelection}
          onClick={handleToggleMirror}
        />
      )}
    </>
  )
}
