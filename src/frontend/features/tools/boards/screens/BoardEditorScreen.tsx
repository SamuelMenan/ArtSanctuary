'use client'

import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'
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

export default function BoardEditorPage() {
  const params = useParams<{ id: string }>()
  return (
    <BoardEditor boardId={params.id} />
  )
}
