'use client'

import AppShell from '@/components/layout/AppShell'
import ToolActiveLayout from '@/components/tools/ToolActiveLayout'
import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'

// Konva toca `window`: el editor se carga solo en cliente.
const BoardEditor = dynamic(() => import('@/components/boards/BoardEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <span className="material-symbols-outlined animate-spin text-[var(--color-primary)] text-3xl">refresh</span>
    </div>
  ),
})

export default function BoardEditorPage() {
  const params = useParams<{ id: string }>()
  return (
    <AppShell>
      <ToolActiveLayout>
        <BoardEditor boardId={params.id} />
      </ToolActiveLayout>
    </AppShell>
  )
}
