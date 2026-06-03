// Dominio Carnaval: lo que el registro de workspaces necesita saber de este
// tipo a nivel puro (escala por modalidad). La UI/overlays viven aparte en
// features/workspaces/carnaval.

import { createScaler, defaultScaler, type Scaler } from '@shared/lib/measure'
import type { BoardWorkspace } from '@shared/lib/boards/types'
import type { WorkspaceDomain } from '../types'
import { getCarnavalRule } from './index'

export const carnavalDomain: WorkspaceDomain = {
  kind: 'carnaval',
  scaler(ws: BoardWorkspace): Scaler {
    if (ws.modality) return createScaler(getCarnavalRule(ws.modality).scale, 1)
    return defaultScaler
  },
}
