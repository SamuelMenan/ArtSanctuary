'use client'

import { useParams } from 'next/navigation'
import RecursosCulturalesScreen from '@frontend/features/workspaces/carnaval/screens/RecursosCulturalesScreen'

export default function RecursosCulturalesPage() {
  const { id } = useParams<{ id: string }>()
  return <RecursosCulturalesScreen projectId={id} />
}
