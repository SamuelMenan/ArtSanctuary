// Plugin de UI del tipo Libre (stub — "próximamente"). Aparece en el selector
// deshabilitado. Cuando se implemente el Proyecto Libre real, poner enabled:true
// y añadir variants/createProject.

import { type WorkspaceUiPlugin, fmtWorkspaceDate } from '../shared/workspacePlugin'

export const librePlugin: WorkspaceUiPlugin = {
  id: 'libre',
  enabled: false,
  meta: { labelKey: 'workspaces.libre', descKey: 'workspaces.libreDesc', icon: 'dashboard' },
  card: (p, t) => ({
    icon: 'dashboard',
    subtitle: `${t('workspaces.libre')} · ${fmtWorkspaceDate(p.updatedAt)}`,
  }),
}
