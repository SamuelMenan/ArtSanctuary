'use client'

import { cmOf, formatCm, formatScaled } from '@shared/lib/measure'
import ImageSourceModal from '@frontend/features/tools/shared/ImageSourceModal'
import MeasureBar from '@frontend/features/tools/shared/workspace/MeasureBar'
import ToolWorkspace from '@frontend/features/tools/shared/workspace/ToolWorkspace'
import { useCutoutEditor } from '@frontend/features/tools/crop/useCutoutEditor'
import CutoutToolbar from '@frontend/features/tools/crop/components/CutoutToolbar'
import CutoutStage from '@frontend/features/tools/crop/components/CutoutStage'

export default function CutoutTool() {
  const editor = useCutoutEditor()
  const w = editor.work.current

  return (
    <ToolWorkspace
      panel={<CutoutToolbar editor={editor} />}
      stage={<CutoutStage editor={editor} />}
      footer={w && (
        <MeasureBar
          referenceLabel={`${formatCm(cmOf(w.width))} × ${formatCm(cmOf(w.height))}`}
          finalLabel={`${formatScaled(cmOf(w.width))} × ${formatScaled(cmOf(w.height))}`}
        />
      )}
      modal={editor.modalOpen && (
        <ImageSourceModal
          onClose={() => editor.setModalOpen(false)}
          onSelect={(url) => { editor.setImageUrl(url); editor.setModalOpen(false) }}
        />
      )}
    />
  )
}
