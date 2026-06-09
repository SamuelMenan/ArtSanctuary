'use client'

import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { UNITS, type Unit } from '@shared/lib/canon/units'
import { appBarShellSecondary, appBarBg } from '@frontend/shared/layouts/appbar/appBarStyles'
import { VIEWS, type View, type CanonOption } from '../lib/figureMeta'
import { EXTRA_LAYER_KEYS, type ChartLayers } from '../lib/chartLayers'

const LAYER_KEYS = ['canon', 'anatomy', 'widths', 'loomis', ...EXTRA_LAYER_KEYS] as const

const lbl = 'font-mono text-[10px] text-[var(--color-on-surface-variant)] uppercase tracking-wider whitespace-nowrap shrink-0'
const sel =
  'h-7 min-w-0 bg-transparent border border-[var(--color-outline-variant)] rounded-md px-1.5 text-[var(--color-primary)] font-mono text-label-sm cursor-pointer focus:outline-none focus:border-[var(--color-primary)]'
const sep = 'w-px self-center h-5 bg-[var(--color-outline-variant)] shrink-0'

export interface CanonTopBarProps {
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
}

/**
 * Barra superior de Canon (secundaria, 42px). Aloja los controles de uso
 * frecuente — canon · altura · vista · unidad · capas — siempre visibles
 * (también en pantallas chicas donde el panel lateral se oculta). Mismas alturas
 * y estilos que crop/grid/boards (`appBarShellSecondary`). Scroll horizontal si
 * no caben; nunca crece en alto.
 */
export default function CanonTopBar(p: CanonTopBarProps) {
  const { t } = usePreferences()
  return (
    <div className={`${appBarShellSecondary} ${appBarBg.solid} gap-3 overflow-x-auto`}>
      {p.canons.length > 1 && (
        <select aria-label={t('canon.canon')} value={p.canonId} onChange={(e) => p.onCanon(e.target.value)} className={sel}>
          {p.canons.map((c) => (
            <option key={c.id} value={c.id}>
              {t(`canon.names.${c.id}`)}{c.available === false ? ` · ${t('canon.noPlate')}` : ''}
            </option>
          ))}
        </select>
      )}

      <div className="flex items-center gap-1.5 shrink-0">
        <input
          aria-label={t('canon.totalHeight')}
          type="number"
          value={p.height}
          onChange={(e) => p.onHeight(Number(e.target.value))}
          className={`${sel} w-16 text-center appearance-none`}
        />
        <span className={lbl}>cm</span>
      </div>

      <select aria-label={t('canon.view')} value={p.view} onChange={(e) => p.onView(e.target.value as View)} className={sel}>
        {VIEWS.map((v) => (
          <option key={v} value={v}>{t(`canon.views.${v}`)}</option>
        ))}
      </select>

      <select aria-label={t('canon.unit')} value={p.unit} onChange={(e) => p.onUnit(e.target.value as Unit)} className={sel}>
        {UNITS.map((un) => (
          <option key={un} value={un}>{t(`canon.units.${un}`)}</option>
        ))}
      </select>

      <span className={sep} aria-hidden />

      <span className={lbl}>{t('canon.layers')}</span>
      <div className="flex items-center gap-1 shrink-0">
        {LAYER_KEYS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => p.onToggleLayer(k)}
            aria-pressed={p.layers[k]}
            className={`h-7 px-2 rounded-md border font-mono text-[10px] uppercase tracking-wider transition-colors whitespace-nowrap ${
              p.layers[k]
                ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/10'
                : 'border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] hover:border-[var(--color-outline)]'
            }`}
          >
            {t(`canon.${k}`)}
          </button>
        ))}
      </div>
    </div>
  )
}
