// Contrato de dominio (puro, sin React) de los tipos de Workspace.
// La capa de UI (features/workspaces) tiene su propio contrato de plugin que
// compone sobre éste. Aquí solo vive lo agnóstico de framework.

import type { Scaler } from '@shared/lib/measure'
import type { BoardWorkspace } from '@shared/lib/boards/types'

/**
 * Tipos de workspace soportados. Crece sin tocar el motor `boards`:
 * 'escultura' | 'personajes' | 'arteterapia' | ...
 */
export type WorkspaceKind = 'free' | 'carnaval'

/**
 * Descriptor de dominio de un tipo de workspace. Cada tipo registra el suyo
 * (ver `registry.ts`). Mantener PURO: sin imports de React ni de Konva.
 */
export interface WorkspaceDomain {
  kind: WorkspaceKind
  /** Escala efectiva del board para este workspace. Omitir = escala por defecto. */
  scaler?: (ws: BoardWorkspace) => Scaler
}
