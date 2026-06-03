'use client'

import { useParams } from 'next/navigation'
import ExpedienteScreen from '@frontend/features/workspaces/carnaval/screens/ExpedienteScreen'

export default function ExpedientePage() {
  const { id } = useParams<{ id: string }>()
  return <ExpedienteScreen projectId={id} />
}
