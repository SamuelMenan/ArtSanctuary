// Registro de dominios de Workspace. Único punto que conoce todos los tipos a
// nivel de dominio. Agregar un tipo = registrar su WorkspaceDomain aquí.
// Reemplaza el hardcode de Carnaval que vivía en `boards/types.ts`.

import { defaultScaler, type Scaler } from '@shared/lib/measure'
import type { BoardWorkspace } from '@shared/lib/boards/types'
import type { WorkspaceDomain, WorkspaceKind } from './types'
import { carnavalDomain } from './carnaval/domain'

const REGISTRY: Partial<Record<WorkspaceKind, WorkspaceDomain>> = {}

export function registerWorkspaceDomain(domain: WorkspaceDomain): void {
  REGISTRY[domain.kind] = domain
}

export function getWorkspaceDomain(kind: WorkspaceKind): WorkspaceDomain | undefined {
  return REGISTRY[kind]
}

// ── Dominios incorporados ──
// 'free' no necesita dominio (usa la escala por defecto). Carnaval sí.
registerWorkspaceDomain(carnavalDomain)

/**
 * Escala efectiva del board según su workspace. Sustituye a `boardScaler`.
 * El motor `boards` ya no conoce ninguna modalidad concreta.
 */
export function workspaceScaler(ws?: BoardWorkspace): Scaler {
  if (!ws) return defaultScaler
  const domain = REGISTRY[ws.kind]
  return domain?.scaler ? domain.scaler(ws) : defaultScaler
}
