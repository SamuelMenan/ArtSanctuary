import { type WorkspaceUiPlugin } from './workspacePlugin'
import { librePlugin } from '../libre/ui'
import { carnavalPlugin } from '../carnaval/ui'

const REGISTRY: WorkspaceUiPlugin[] = [librePlugin, carnavalPlugin]

export function allWorkspaceUi(): readonly WorkspaceUiPlugin[] {
  return REGISTRY
}

export function getWorkspaceUi(id: string): WorkspaceUiPlugin | undefined {
  return REGISTRY.find((p) => p.id === id)
}
