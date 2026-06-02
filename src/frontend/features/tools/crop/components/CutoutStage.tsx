'use client'

import ToolStage from '@frontend/features/tools/shared/workspace/ToolStage'
import type { CutoutEditor } from '@frontend/features/tools/crop/useCutoutEditor'

/** Escenario con damero (transparencia) sobre ToolStage: lienzo o llamada a subir. */
export default function CutoutStage({ editor }: { editor: CutoutEditor }) {
  const { stageRef, displayRef, ready, toolMode, error, setModalOpen, onPointerDown, onPointerMove, onPointerUp } = editor

  return (
    <ToolStage
      stageRef={stageRef}
      hasImage={ready}
      checker
      emptyIcon="auto_fix_high"
      onPickImage={() => setModalOpen(true)}
      error={error}
    >
      <canvas
        ref={displayRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        className={`absolute inset-0 touch-none ${toolMode ? 'cursor-crosshair' : ''}`}
      />
    </ToolStage>
  )
}
