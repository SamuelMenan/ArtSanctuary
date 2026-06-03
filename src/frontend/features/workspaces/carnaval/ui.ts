// Plugin de UI del tipo Carnaval para la landing de Workspaces.

import { CARNAVAL_MODALITIES, getCarnavalRule, type CarnavalModality } from '@shared/lib/workspaces/carnaval'
import { registerWorkspaceUi, fmtWorkspaceDate } from '../shared/workspacePlugin'

registerWorkspaceUi({
  id: 'carnaval',
  enabled: true,
  meta: { labelKey: 'workspaces.carnaval', descKey: 'workspaces.carnavalDesc', icon: 'festival' },

  variants: () =>
    CARNAVAL_MODALITIES.map((m) => {
      const rule = getCarnavalRule(m)
      return {
        id: m,
        label: rule.label,
        sublabel: `1:${rule.scale} · ${rule.bocetosRequeridos} ${rule.bocetosRequeridos === 1 ? 'boceto' : 'bocetos'}`,
      }
    }),

  createProject: async (variantId) => {
    const res = await fetch('/api/carnaval-projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modality: variantId, year: 2027 }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error?.message ?? data?.error ?? '')
    return data.project._id as string
  },

  card: (p) => ({
    icon: 'festival',
    subtitle: p.modality
      ? `${getCarnavalRule(p.modality as CarnavalModality).label} · ${p.year} · ${fmtWorkspaceDate(p.updatedAt)}`
      : fmtWorkspaceDate(p.updatedAt),
    statusBadgeKey: `carnaval.status_${p.accreditationStatus}`,
  }),
})
