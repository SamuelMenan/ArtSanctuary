'use client'

import { useState } from 'react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { withinRef } from '@shared/lib/canon/measurements'
import { formatValue, type Unit } from '@shared/lib/canon/units'
import { partTree, dimHeads, dimCm, type BodyPart, type PartDimension } from '@shared/lib/canon/anatomyParts'

const REGION_ICON: Record<string, string> = { head: 'face', trunk: 'accessibility_new', arm: 'back_hand', leg: 'footprint' }

/** Etiqueta de una parte/sub-parte. Las falanges (`<dedo>_<kind>`) se etiquetan
 *  por su tipo (proximal/media/distal); el resto por su nombre. */
function usePartName() {
  const { t } = usePreferences()
  return (key: string) => {
    const us = key.indexOf('_')
    if (us > 0) return t(`canon.part.phalanx.${key.slice(us + 1)}`)
    return t(`canon.part.names.${key}`)
  }
}

/** Fila de una dimensión: etiqueta · valor (escalado por headCm + unidad) · Δ. */
function DimRow({ part, dim, headCm, unit, u, depth }: { part: BodyPart; dim: PartDimension; headCm: number; unit: Unit; u: string; depth: number }) {
  const { t } = usePreferences()
  const cm = dimCm(part, dim, headCm)
  if (cm === null) return null
  const heads = dimHeads(part, dim)!
  const ok = dim.ref ? withinRef(heads, dim.ref) : true
  const dev = dim.ref ? `Δ${heads - (dim.ref.min + dim.ref.max) / 2 >= 0 ? '+' : ''}${(heads - (dim.ref.min + dim.ref.max) / 2).toFixed(2)}` : ''
  return (
    <div className="flex items-baseline justify-between gap-2 py-0.5" style={{ paddingLeft: depth * 10 }}>
      <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-on-surface-variant)]">{t(`canon.part.dim.${dim.key}`)}</span>
      <span className="flex items-baseline gap-1.5 whitespace-nowrap">
        <span className="font-mono text-label-sm text-[var(--color-primary)] tabular-nums">{formatValue(cm, unit, headCm)} {u}</span>
        {dev && <span className={`font-mono text-[10px] ${ok ? 'text-emerald-500' : 'text-amber-500'}`}>{dev}</span>}
      </span>
    </div>
  )
}

/** Nodo de parte: cabecera plegable (si tiene sub-partes) + sus dims + hijos. */
function PartNode({ part, headCm, unit, u, depth }: { part: BodyPart; headCm: number; unit: Unit; u: string; depth: number }) {
  const name = usePartName()
  const hasChildren = !!part.children?.length
  const [open, setOpen] = useState(false)
  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => hasChildren && setOpen((v) => !v)}
        className={`flex items-center gap-1 py-0.5 text-left ${hasChildren ? 'cursor-pointer hover:text-[var(--color-primary)]' : 'cursor-default'}`}
        style={{ paddingLeft: depth * 10 }}
        aria-expanded={hasChildren ? open : undefined}
      >
        {hasChildren ? (
          <span className="material-symbols-outlined text-[14px] leading-none text-[var(--color-on-surface-variant)]">{open ? 'expand_more' : 'chevron_right'}</span>
        ) : (
          <span className="w-[14px]" />
        )}
        <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-on-surface)]">{name(part.key)}</span>
      </button>
      {part.dims.map((d) => (
        <DimRow key={d.key} part={part} dim={d} headCm={headCm} unit={unit} u={u} depth={depth + 1} />
      ))}
      {hasChildren && open && (
        <div className="flex flex-col">
          {part.children!.map((c) => (
            <PartNode key={c.key} part={c} headCm={headCm} unit={unit} u={u} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Panel derecho: **atlas anatómico** en árbol región → parte → sub-parte → dims.
 * Cada dimensión es un ratio escalable (se recalcula con la altura/canon vía
 * `headCm`) con su Δ vs referencia. Reemplaza la lista plana anterior.
 */
export default function CanonMeasuresPanel({
  unit,
  headCm,
  canonId,
}: {
  unit: Unit
  headCm: number
  canonId: string
}) {
  const { t } = usePreferences()
  const u = t(`canon.units.${unit}`)

  return (
    <aside className="hidden lg:flex w-72 shrink-0 flex-col overflow-y-auto border-l border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] p-4">
      <div className="flex flex-col gap-0.5">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-primary)]">{t(`canon.names.${canonId}`)}</span>
        <span className="font-mono text-[10px] tabular-nums text-[var(--color-on-surface-variant)]">{t('canon.baseUnit', { n: headCm.toFixed(2) })}</span>
        <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--color-on-surface-variant)]/60">{t('canon.atlasNote')}</span>
      </div>

      {partTree().map(({ region, parts }) => (
        <div key={region} className="mt-3 flex flex-col">
          <div className="mb-1 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px] text-[var(--color-on-surface-variant)]/70">{REGION_ICON[region]}</span>
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-on-surface-variant)]/70">{t(`canon.part.regions.${region}`)}</h3>
          </div>
          <div className="flex flex-col divide-y divide-[var(--color-outline-variant)]/20">
            {parts.map((p) => (
              <div key={p.key} className="py-0.5">
                <PartNode part={p} headCm={headCm} unit={unit} u={u} depth={0} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </aside>
  )
}
