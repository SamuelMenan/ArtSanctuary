'use client'

import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import type { FigureModel } from '@shared/lib/canon/figure'
import type { Unit } from '@shared/lib/canon/units'
import ProportionChart from './ProportionChart'
import { type ChartLayers } from '../lib/chartLayers'
import ChartCrossfade from './ChartCrossfade'
import { VIEWS, type View } from '../lib/figureMeta'
import type { CanonOption } from './CanonToolbar'

const miniField =
  'bg-[var(--color-surface-dim)] border border-[var(--color-outline-variant)] rounded-[var(--radius-sm)] px-2 py-0.5 text-[var(--color-primary)] font-mono text-[11px] focus:ring-0 focus:border-[var(--color-primary)]'

export interface ComparePanelEdit {
  canons: CanonOption[]
  onCanon: (id: string) => void
  onHeight: (cm: number) => void
  onView: (v: View) => void
}

/**
 * Un lado del comparador: cabecera (nombre del canon + altura, o mini-controles
 * editables) y el chart. `edit` presente → lado configurable (el B); ausente →
 * solo lectura (el A, gobernado por la barra principal).
 */
export default function CanonComparePanel({
  figure,
  view,
  unit,
  layers,
  edit,
}: {
  figure: FigureModel
  view: View
  unit: Unit
  layers: ChartLayers
  edit?: ComparePanelEdit
}) {
  const { t } = usePreferences()

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col items-center overflow-auto">
      <div className="mb-3 flex flex-wrap items-center justify-center gap-2 shrink-0">
        {edit ? (
          <>
            {edit.canons.length > 1 && (
              <select aria-label={t('canon.canon')} value={figure.canonId} onChange={(e) => edit.onCanon(e.target.value)} className={`${miniField} cursor-pointer`}>
                {edit.canons.map((c) => (
                  <option key={c.id} value={c.id}>{t(`canon.names.${c.id}`)}</option>
                ))}
              </select>
            )}
            <input
              type="number"
              aria-label={t('canon.alturaTotal')}
              value={figure.heightCm}
              onChange={(e) => edit.onHeight(Number(e.target.value))}
              className={`${miniField} w-16 text-center`}
            />
            <select aria-label={t('canon.view')} value={view} onChange={(e) => edit.onView(e.target.value as View)} className={`${miniField} cursor-pointer`}>
              {VIEWS.map((v) => (
                <option key={v} value={v}>{t(`canon.views.${v}`)}</option>
              ))}
            </select>
          </>
        ) : (
          <span className="font-mono text-label-sm text-[var(--color-primary)] uppercase tracking-widest">
            {t(`canon.names.${figure.canonId}`)} · {figure.heightCm} cm
          </span>
        )}
      </div>
      <div className="relative h-[64vh] max-h-[800px] shrink-0">
        <ChartCrossfade swapKey={`${figure.canonId}-${view}`}>
          <ProportionChart figure={figure} view={view} layers={layers} unit={unit} />
        </ChartCrossfade>
      </div>
    </div>
  )
}
