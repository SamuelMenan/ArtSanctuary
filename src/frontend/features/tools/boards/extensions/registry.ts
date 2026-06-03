// Registro de extensiones de lienzo por tipo de workspace.
// El motor `boards` consulta `getBoardExtension(workspace.kind)`. Cada plugin
// de tipo se auto-registra al importarse (ver features/workspaces/index.ts).

import type { BoardWorkspaceKind } from '@shared/lib/boards/types'
import type { BoardExtension } from './boardExtension'

const REGISTRY: Partial<Record<BoardWorkspaceKind, BoardExtension>> = {}

export function registerBoardExtension(ext: BoardExtension): void {
  REGISTRY[ext.kind] = ext
}

export function getBoardExtension(kind: BoardWorkspaceKind): BoardExtension | undefined {
  return REGISTRY[kind]
}
