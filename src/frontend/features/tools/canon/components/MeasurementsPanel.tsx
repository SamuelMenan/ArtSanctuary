'use client'

import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { withinRef, type Measurement } from '@shared/lib/canon/measurements'
import { formatValue, type Unit } from '@shared/lib/canon/units'

/** Etiqueta i18n por clave de medida (las de `unit` usan claves propias). */
function labelKey(key: string): string {
  if (key === 'height') return 'canon.totalHeight'
  if (key === 'headUnit') return 'canon.measure.headUnit'
  return `canon.measure.${key}`
}

function Row({ m, label, unit, headCm, u }: { m: Measurement; label: string; unit: Unit; headCm: number; u: string }) {
  const ok = m.ref ? withinRef(m.heads, m.ref) : true
  const rangeText = m.ref ? `${m.ref.min.toFixed(2)}–${m.ref.max.toFixed(2)}` : ''
  const devText = m.deviation !== undefined ? `Δ${m.deviation >= 0 ? '+' : ''}${m.deviation.toFixed(2)}` : ''
  return (
    <div className="flex flex-col py-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-label-sm text-[var(--color-on-surface-variant)] uppercase tracking-wider">{label}</span>
        <span className="flex items-baseline gap-2 whitespace-nowrap">
          <span className="font-mono text-label-sm text-[var(--color-primary)]">{formatValue(m.cm, unit, headCm)} {u}</span>
          {unit !== 'heads' && (
            <span className="font-mono text-[10px] text-[var(--color-on-surface-variant)]/60">{m.heads.toFixed(2)}</span>
          )}
        </span>
      </div>
      {m.ref && m.deviation !== undefined && (
        <div className="flex items-baseline justify-end gap-2 whitespace-nowrap font-mono text-[10px]">
          <span className="text-[var(--color-on-surface-variant)]/50">{rangeText}</span>
          <span className={ok ? 'text-emerald-500' : 'text-amber-500'}>{devText}</span>
        </div>
      )}
    </div>
  )
}

/**
 * Panel de medidas anatómicas (paramétrico): unidad base + anchos + largos, en
 * la unidad elegida y en unidades-cabeza. Se recalcula con altura y canon.
 */
export default function MeasurementsPanel({
  measurements,
  unit = 'cm',
  headCm,
}: {
  measurements: Measurement[]
  unit?: Unit
  headCm: number
}) {
  const { t } = usePreferences()
  const u = t(`canon.units.${unit}`)
  const unitRows = measurements.filter((m) => m.group === 'unit')
  const widths = measurements.filter((m) => m.group === 'width')
  const lengths = measurements.filter((m) => m.group === 'length')

  const section = (title: string, rows: Measurement[]) => (
    <div className="flex flex-col">
      <h3 className="font-mono text-[10px] text-[var(--color-on-surface-variant)]/70 uppercase tracking-widest mb-1 mt-3">{title}</h3>
      {rows.map((m) => (
        <Row key={m.key} m={m} label={t(labelKey(m.key))} unit={unit} headCm={headCm} u={u} />
      ))}
    </div>
  )

  return (
    <div className="flex flex-col divide-y divide-[var(--color-outline-variant)]/30">
      <div className="flex flex-col pb-1">
        {unitRows.map((m) => (
          <Row key={m.key} m={m} label={t(labelKey(m.key))} unit={unit} headCm={headCm} u={u} />
        ))}
      </div>
      {section(t('canon.measure.widths'), widths)}
      {section(t('canon.measure.lengths'), lengths)}
    </div>
  )
}
