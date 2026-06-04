'use client'

// Registra los plugins de workspace (side-effect) antes de montar el editor,
import '@frontend/features/workspaces'

import * as React from 'react'
import AppShell from '@frontend/shared/layouts/AppShell'
import ToolActiveLayout from '@frontend/features/tools/shared/ToolActiveLayout'
import dynamic from 'next/dynamic'

// Konva toca `window`: el editor se carga solo en cliente.
const BoardEditor = dynamic(() => import('@frontend/features/tools/boards/BoardEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <span className="material-symbols-outlined animate-spin text-[var(--color-primary)] text-3xl">refresh</span>
    </div>
  ),
})

export default function WorkspaceBoardEditorPage({ params }: { params: Promise<{ id: string; boardId: string }> }) {
  const { id, boardId } = React.use(params)
  
  return (
    <AppShell>
      <ToolActiveLayout projectId={id}>
        <BoardEditor boardId={boardId} />
      </ToolActiveLayout>
    </AppShell>
  )
}
