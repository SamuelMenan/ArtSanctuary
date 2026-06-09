'use client'

import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { withinRef, type Measurement } from '@shared/lib/canon/measurements'
import { formatValue, type Unit } from '@shared/lib/canon/units'
import type { View } from '../lib/figureMeta'

function labelKey(key: string): string {
  if (key === 'height') return 'canon.totalHeight'
  if (key === 'headUnit') return 'canon.measure.headUnit'
  return `canon.measure.${key}`
}

/** Fila de una medida: etiqueta · valor · Δ (color según rango). */
function Row({ m, unit, headCm, u, label }: { m: Measurement; unit: Unit; headCm: number; u: string; label: string }) {
  const ok = m.ref ? withinRef(m.heads, m.ref) : true
  const dev = m.deviation !== undefined ? `Δ${m.deviation >= 0 ? '+' : ''}${m.deviation.toFixed(2)}` : ''
  return (
    <div className="flex items-baseline justify-between gap-2 py-1">
      <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-on-surface-variant)]">{label}</span>
      <span className="flex items-baseline gap-1.5 whitespace-nowrap">
        <span className="font-mono text-label-sm text-[var(--color-primary)] tabular-nums">{formatValue(m.cm, unit, headCm)} {u}</span>
        {dev && <span className={`font-mono text-[10px] ${ok ? 'text-emerald-500' : 'text-amber-500'}`}>{dev}</span>}
      </span>
    </div>
  )
}

/**
 * Panel lateral DERECHO de medidas (vertical, scroll propio). Unidad base +
 * medidas transversales (anchos en frontal/posterior, PROFUNDIDADES en lateral)
 * + largos, cada una con Δ vs referencia anatómica. La ficha "Sobre este canon"
 * NO va aquí (ya aparece al pasar por un landmark). Tokens compartidos.
 */
export default function CanonMeasuresPanel({
  measurements,
  unit,
  headCm,
  canonId,
  view,
}: {
  measurements: Measurement[]
  unit: Unit
  headCm: number
  canonId: string
  view: View
}) {
  const { t } = usePreferences()
  const u = t(`canon.units.${unit}`)
  const widths = measurements.filter((m) => m.group === 'width')
  const lengths = measurements.filter((m) => m.group === 'length')
  // En vista lateral las medidas transversales son profundidades.
  const transTitle = t(view === 'lateral' ? 'canon.measure.depths' : 'canon.measure.widths')

  const section = (title: string, rows: Measurement[]) => (
    <div className="flex flex-col">
      <h3 className="mb-0.5 mt-3 font-mono text-[10px] uppercase tracking-widest text-[var(--color-on-surface-variant)]/70">{title}</h3>
      <div className="divide-y divide-[var(--color-outline-variant)]/30">
        {rows.map((m) => (
          <Row key={m.key} m={m} unit={unit} headCm={headCm} u={u} label={t(labelKey(m.key))} />
        ))}
      </div>
    </div>
  )

  return (
    <aside className="hidden lg:flex w-72 shrink-0 flex-col overflow-y-auto border-l border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] p-4">
      {/* Cabecera: canon + unidad base */}
      <div className="flex flex-col gap-0.5">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-primary)]">{t(`canon.names.${canonId}`)}</span>
        <span className="font-mono text-[10px] tabular-nums text-[var(--color-on-surface-variant)]">{t('canon.baseUnit', { n: headCm.toFixed(2) })}</span>
      </div>

      {section(transTitle, widths)}
      {section(t('canon.measure.lengths'), lengths)}
    </aside>
  )
}
