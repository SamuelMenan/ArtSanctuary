'use client'

import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { UNITS, type Unit } from '@shared/lib/canon/units'
import { VIEWS, type View } from '../lib/figureMeta'
import { EXTRA_LAYER_KEYS, type ChartLayers } from '../lib/chartLayers'
import CanonActions from './CanonActions'

// canon/anatomy (dibujadas) + las extra (skeleton/muscles/joints). Se muestran
// TODAS aunque aún no tengan asset/data: el chart simplemente no cambia.
const LAYER_KEYS = ['canon', 'anatomy', 'widths', 'loomis', ...EXTRA_LAYER_KEYS] as const

const fieldCls =
  'bg-[var(--color-surface-dim)] border border-[var(--color-outline-variant)] rounded-[var(--radius-sm)] px-2 py-1 text-[var(--color-primary)] font-mono text-label-sm focus:ring-0 focus:border-[var(--color-primary)] cursor-pointer'
const labelCls =
  'font-mono text-label-sm text-[var(--color-on-surface-variant)] uppercase tracking-wider whitespace-nowrap'

export interface CanonOption {
  id: string
  headCount: number
  /** Si tiene las 3 láminas. Los sin lámina se muestran marcados igual. */
  available?: boolean
}

export interface CanonToolbarProps {
  canonId: string
  onCanon: (id: string) => void
  canons: CanonOption[]
  height: number
  onHeight: (cm: number) => void
  view: View
  onView: (v: View) => void
  unit: Unit
  onUnit: (u: Unit) => void
  layers: ChartLayers
  onToggleLayer: (k: keyof ChartLayers) => void
  onSendToBoard: () => void
  ghostCanonId: string | null
  onGhost: (id: string | null) => void
  ghostCanons: CanonOption[]
  compare: boolean
  onToggleCompare: () => void
  exporting: null | 'png' | 'pdf' | 'scale'
  onExport: (kind: 'png' | 'pdf' | 'scale') => void
}

/** Barra superior de la herramienta Canon: canon, altura, vista, unidad, capas y export. */
export default function CanonToolbar({
  canonId,
  onCanon,
  canons,
  height,
  onHeight,
  view,
  onView,
  unit,
  onUnit,
  layers,
  onToggleLayer,
  onSendToBoard,
  ghostCanonId,
  onGhost,
  ghostCanons,
  compare,
  onToggleCompare,
  exporting,
  onExport,
}: CanonToolbarProps) {
  const { t } = usePreferences()

  return (
    <div className="min-h-[var(--spacing-appbar-height)] bg-[var(--color-surface-container)] border-b border-[var(--color-outline-variant)] flex flex-wrap items-center justify-between px-[var(--spacing-grid-gutter)] py-2 shrink-0 overflow-x-auto gap-4">
      <div className="flex items-center gap-6">
        {/* Canon (solo cánones con láminas) */}
        {canons.length > 1 && (
          <div className="flex items-center gap-2">
            <label className={labelCls} htmlFor="canon-select">{t('canon.canon')}</label>
            <select
              id="canon-select"
              value={canonId}
              onChange={(e) => onCanon(e.target.value)}
              className={fieldCls}
            >
              {canons.map((c) => (
                <option key={c.id} value={c.id}>
                  {t(`canon.names.${c.id}`)}{c.available === false ? ` · ${t('canon.noPlate')}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Altura */}
        <div className="flex items-center gap-2">
          <label className={labelCls} htmlFor="height-input">{t('canon.totalHeight')}</label>
          <div className="flex items-center bg-[var(--color-surface-dim)] border border-[var(--color-outline-variant)] rounded-[var(--radius-sm)] px-2 py-1">
            <input
              className="bg-transparent border-none text-[var(--color-primary)] font-mono text-label-sm p-0 w-12 text-center focus:ring-0 appearance-none"
              id="height-input"
              type="number"
              value={height}
              onChange={(e) => onHeight(Number(e.target.value))}
            />
            <span className="font-mono text-label-sm text-[var(--color-on-surface-variant)] ml-1 mr-2">cm</span>
          </div>
        </div>

        {/* Vista */}
        <div className="flex items-center gap-2">
          <label className={labelCls} htmlFor="view-select">{t('canon.view')}</label>
          <select id="view-select" value={view} onChange={(e) => onView(e.target.value as View)} className={fieldCls}>
            {VIEWS.map((v) => (
              <option key={v} value={v}>{t(`canon.views.${v}`)}</option>
            ))}
          </select>
        </div>

        {/* Unidad */}
        <div className="flex items-center gap-2">
          <label className={labelCls} htmlFor="unit-select">{t('canon.unit')}</label>
          <select id="unit-select" value={unit} onChange={(e) => onUnit(e.target.value as Unit)} className={fieldCls}>
            {UNITS.map((un) => (
              <option key={un} value={un}>{t(`canon.units.${un}`)}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className={labelCls}>{t('canon.layers')}</span>
          <div className="flex items-center gap-1">
            {LAYER_KEYS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => onToggleLayer(k)}
                aria-pressed={layers[k]}
                className={`px-2 py-1 rounded-[var(--radius-sm)] border font-mono text-label-sm uppercase tracking-wider transition-all ${
                  layers[k]
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/10'
                    : 'border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] bg-transparent'
                }`}
              >
                {t(`canon.${k}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <CanonActions
        ghostCanonId={ghostCanonId}
        onGhost={onGhost}
        ghostCanons={ghostCanons}
        onSendToBoard={onSendToBoard}
        compare={compare}
        onToggleCompare={onToggleCompare}
        exporting={exporting}
        onExport={onExport}
      />
    </div>
  )
}
