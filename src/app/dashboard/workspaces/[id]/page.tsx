'use client'

import { useParams } from 'next/navigation'
import WorkspaceProjectScreen from '@frontend/features/workspaces/carnaval/screens/WorkspaceProjectScreen'

export default function WorkspaceProjectPage() {
  const { id } = useParams<{ id: string }>()
  return <WorkspaceProjectScreen projectId={id} />
}
