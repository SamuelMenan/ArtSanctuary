'use client'

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { withinRef } from '@shared/lib/canon/measurements'
import { landmarkPositionsCm, segmentLengthsCm } from '@shared/lib/canon/landmarks'
import type { FigureModel } from '@shared/lib/canon/figure'
import { formatValue, type Unit } from '@shared/lib/canon/units'
import { motion } from 'motion/react'
import { staggerParent, fadeSlide } from '@frontend/shared/motion/tokens'
import { partTree, dimHeads, dimCm, type BodyPart, type PartDimension } from '@shared/lib/canon/anatomyParts'
import { CANON_NOTES, CROSS_RULES } from '@shared/lib/canon/anatomyFacts'
import PanelSection from '@frontend/shared/ui/PanelSection'
import SourceBadge from './SourceBadge'

const REGION_ICON: Record<string, string> = { head: 'face', trunk: 'accessibility_new', arm: 'back_hand', leg: 'footprint' }

/** Etiqueta de parte/sub-parte. Falanges (`<dedo>_<kind>`) por su tipo. */
function usePartName() {
  const { t } = usePreferences()
  return (key: string) => {
    const us = key.indexOf('_')
    if (us > 0) return t(`canon.part.phalanx.${key.slice(us + 1)}`)
    return t(`canon.part.names.${key}`)
  }
}

/** Fila simple: etiqueta · valor (escalado) · sufijo opcional (Δ o segmento). */
function ValueRow({ label, cm, unit, headCm, u, depth = 0, extra }: { label: string; cm: number; unit: Unit; headCm: number; u: string; depth?: number; extra?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-0.5" style={{ paddingLeft: depth * 10 }}>
      <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-on-surface-variant)]">{label}</span>
      <span className="flex items-baseline gap-1.5 whitespace-nowrap">
        <span className="font-mono text-label-sm text-[var(--color-primary)] tabular-nums">{formatValue(cm, unit, headCm)} {u}</span>
        {extra}
      </span>
    </div>
  )
}

/** Dimensión del atlas (referencia ideal): valor + Δ vs rango. */
function DimRow({ part, dim, headCm, unit, u, depth }: { part: BodyPart; dim: PartDimension; headCm: number; unit: Unit; u: string; depth: number }) {
  const { t } = usePreferences()
  const cm = dimCm(part, dim, headCm)
  if (cm === null) return null
  const heads = dimHeads(part, dim)!
  const ok = dim.ref ? withinRef(heads, dim.ref) : true
  const dev = dim.ref ? `Δ${heads - (dim.ref.min + dim.ref.max) / 2 >= 0 ? '+' : ''}${(heads - (dim.ref.min + dim.ref.max) / 2).toFixed(2)}` : ''
  return (
    <ValueRow
      label={t(`canon.part.dim.${dim.key}`)} cm={cm} unit={unit} headCm={headCm} u={u} depth={depth}
      extra={dev ? <span className={`font-mono text-[10px] ${ok ? 'text-emerald-500' : 'text-amber-500'}`}>{dev}</span> : undefined}
    />
  )
}

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
      {hasChildren && open && part.children!.map((c) => (
        <PartNode key={c.key} part={c} headCm={headCm} unit={unit} u={u} depth={depth + 1} />
      ))}
    </div>
  )
}

/**
 * Panel derecho. FIDELIDAD (P10): arriba las **medidas reales** (posiciones de
 * landmarks medidas del dibujo = lo mismo que mide la regla → replicable exacto);
 * debajo, plegable, el **atlas anatómico** como REFERENCIA (ideal + Δ). Una sola
 * fuente para lo medido; el ideal no compite, contextualiza.
 */
export default function CanonMeasuresPanel({ figure, unit }: { figure: FigureModel; unit: Unit }) {
  const { t } = usePreferences()
  const { canonId, heightCm, headCm } = figure
  const u = t(`canon.units.${unit}`)

  const positions = landmarkPositionsCm(canonId, heightCm)
  const segments = segmentLengthsCm(canonId, heightCm)

  // Fades sin scrollbar: indican contenido oculto arriba/abajo (como el sidebar).
  const scrollRef = useRef<HTMLDivElement>(null)
  const [fade, setFade] = useState({ top: false, bottom: false })
  const updateFades = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const top = el.scrollTop > 4
    const bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 4
    setFade((prev) => (prev.top === top && prev.bottom === bottom ? prev : { top, bottom }))
  }, [])
  // Listener de resize: se suscribe una sola vez (updateFades es estable).
  useEffect(() => {
    window.addEventListener('resize', updateFades)
    return () => window.removeEventListener('resize', updateFades)
  }, [updateFades])
  // Recalcula al cambiar el contenido (canon → distinto nº de filas).
  useEffect(() => {
    updateFades()
  }, [updateFades, canonId])

  return (
    <aside className="relative hidden w-72 shrink-0 flex-col overflow-hidden border-l border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] lg:flex">
      <motion.div
        ref={scrollRef}
        onScroll={updateFades}
        variants={staggerParent}
        initial="initial"
        animate="animate"
        className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
      <motion.div variants={fadeSlide} className="flex flex-col gap-0.5">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-primary)]">{t(`canon.names.${canonId}`)}</span>
        <span className="font-mono text-[10px] tabular-nums text-[var(--color-on-surface-variant)]">{t('canon.baseUnit', { n: headCm.toFixed(2) })}</span>
      </motion.div>

      {/* MEDIDAS REALES — geometría del dibujo · escala (coherente con la regla). */}
      <PanelSection title={t('canon.measuredTitle')} icon="straighten" accent>
        <ValueRow label={t('canon.totalHeight')} cm={heightCm} unit={unit} headCm={headCm} u={u} />
        <div className="mt-1 divide-y divide-[var(--color-outline-variant)]/20">
          {positions.map((p, i) => (
            <ValueRow
              key={p.key}
              label={t(`canon.landmarks.${p.key}`)}
              cm={p.cm} unit={unit} headCm={headCm} u={u}
              extra={i > 0 ? <span className="font-mono text-[10px] text-[var(--color-on-surface-variant)]/60">+{formatValue(segments[i - 1].cm, unit, headCm)}</span> : undefined}
            />
          ))}
        </div>
        <span className="mt-1 block font-mono text-[9px] uppercase tracking-wider text-[var(--color-on-surface-variant)]/60">{t('canon.measuredNote')}</span>
      </PanelSection>

      {/* REFERENCIA — atlas ideal + ficha (NO es medida de replicación). */}
      <PanelSection title={t('canon.referenceTitle')} icon="menu_book">
        <div className="flex flex-col gap-3">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-on-surface-variant)]/60">{t('canon.referenceNote')}</span>
          {CANON_NOTES[canonId] && (
            <div className="flex flex-col gap-1.5">
              <p className="font-sans text-[11px] leading-snug text-[var(--color-on-surface)]">{t(`canon.help.note.${canonId}`)}</p>
              <SourceBadge source={CANON_NOTES[canonId].source} />
            </div>
          )}
          {partTree().map(({ region, parts }) => (
            <div key={region} className="flex flex-col">
              <div className="mb-0.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-[var(--color-on-surface-variant)]/70">{REGION_ICON[region]}</span>
                <h4 className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-on-surface-variant)]/70">{t(`canon.part.regions.${region}`)}</h4>
              </div>
              <div className="flex flex-col divide-y divide-[var(--color-outline-variant)]/20">
                {parts.map((p) => (
                  <div key={p.key} className="py-0.5"><PartNode part={p} headCm={headCm} unit={unit} u={u} depth={0} /></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PanelSection>

      {/* REGLAS CRUZADAS — siempre visibles. */}
      <PanelSection title={t('canon.help.crossRules')} icon="rule">
        <div className="flex flex-col gap-2">
          {CROSS_RULES.map((r) => (
            <div key={r.key} className="flex flex-col gap-1 border-l-2 border-[var(--color-primary)]/40 pl-2">
              <p className="font-sans text-[11px] leading-snug text-[var(--color-on-surface-variant)]">{t(`canon.help.rule.${r.key}`)}</p>
              <SourceBadge source={r.source} />
            </div>
          ))}
        </div>
      </PanelSection>
      </motion.div>

      {/* Fades indicadores de scroll (sin scrollbar). No interceptan el ratón. */}
      <div aria-hidden className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-[var(--color-surface-container-low)] to-transparent transition-opacity duration-200 ${fade.top ? 'opacity-100' : 'opacity-0'}`} />
      <div aria-hidden className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 flex h-14 items-end justify-center pb-1 bg-gradient-to-t from-[var(--color-surface-container-low)] from-40% via-[var(--color-surface-container-low)]/85 to-transparent transition-opacity duration-200 ${fade.bottom ? 'opacity-100' : 'opacity-0'}`}>
        <motion.span
          className="material-symbols-outlined text-[22px] text-[var(--color-primary)]"
          animate={{ y: [0, 4, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          keyboard_arrow_down
        </motion.span>
      </div>
    </aside>
  )
}
