'use client'

// Registra los plugins de workspace (side-effect) antes de montar el editor,
import '@frontend/features/workspaces'

import * as React from 'react'
import dynamic from 'next/dynamic'
import Spinner from '@frontend/shared/ui/Spinner'

// Konva toca `window`: el editor se carga solo en cliente.
const BoardEditor = dynamic(() => import('@frontend/features/tools/boards/BoardEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <Spinner className="size-8 text-[var(--color-primary)]" />
    </div>
  ),
})

export default function WorkspaceBoardEditorPage({ params }: { params: Promise<{ id: string; boardId: string }> }) {
  const { id, boardId } = React.use(params)

  return <BoardEditor boardId={boardId} workspaceId={id} />
}
