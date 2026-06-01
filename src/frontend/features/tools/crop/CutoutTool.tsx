'use client'

import ImageSourceModal from '@frontend/features/tools/shared/ImageSourceModal'
import { useCutoutEditor } from '@frontend/features/tools/crop/useCutoutEditor'
import CutoutToolbar from '@frontend/features/tools/crop/components/CutoutToolbar'
import CutoutStage from '@frontend/features/tools/crop/components/CutoutStage'

export default function CutoutTool() {
  const editor = useCutoutEditor()

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      <CutoutToolbar editor={editor} />
      <CutoutStage editor={editor} />

      {editor.modalOpen && (
        <ImageSourceModal
          onClose={() => editor.setModalOpen(false)}
          onSelect={(url) => { editor.setImageUrl(url); editor.setModalOpen(false) }}
        />
      )}
    </div>
  )
}
