'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import type { FigureModel } from '@shared/lib/canon/figure'
import { getPart } from '@shared/lib/canon/anatomyParts'
import { getRegion } from '@shared/lib/canon/regions'
import { getPartHits } from '@shared/lib/canon/partHits'
import { formatValue, type Unit } from '@shared/lib/canon/units'
import { type View, figureSrc, figureDims } from '../lib/figureMeta'
import SourceBadge from './SourceBadge'

/** Bbox del PRIMER subpath (instancia izquierda en pareadas) + padding. */
function hitBbox(path: string, pad = 0.08): { x: number; y: number; w: number; h: number } | null {
  const first = path.split('M').filter(Boolean)[0]
  const nums = first?.match(/[\d.]+/g)?.map(Number)
  if (!nums || nums.length < 6) return null
  const xs = nums.filter((_, i) => i % 2 === 0)
  const ys = nums.filter((_, i) => i % 2 === 1)
  const x0 = Math.max(0, Math.min(...xs) - pad)
  const y0 = Math.max(0, Math.min(...ys) - pad)
  const x1 = Math.min(1, Math.max(...xs) + pad)
  const y1 = Math.min(1, Math.max(...ys) + pad)
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}

/**
 * Ficha de la parte seleccionada (A4): imagen dedicada si existe
 * (`anatomyParts.image[view]`) o **zoom a la región del path** sobre la lámina
 * principal (fallback, sin esperar assets) + nota + fuentes. Las DIMENSIONES
 * no se duplican aquí: viven en el árbol de referencia, que al seleccionar se
 * FILTRA a esta parte (la ficha encabeza, el árbol detalla).
 */
export default function CanonPartPanel({
  figure,
  view,
  partKey,
  unit,
  onClose,
}: {
  figure: FigureModel
  view: View
  partKey: string
  unit: Unit
  onClose: () => void
}) {
  const { t } = usePreferences()
  // Una parte-con-dim (atlas) O una región-zona de superficie (solo nombre+blurb).
  const part = getPart(partKey)
  const region = part ? undefined : getRegion(partKey)
  const hit = getPartHits(figure.canonId, view)[partKey]
  const bbox = useMemo(() => (hit ? hitBbox(hit.path) : null), [hit])

  if (!part && !region) return null

  const dedicated = part?.image[view]
  const dims = figureDims(figure.canonId, view)
  // Dims solo de la parte-atlas; las regiones-zona muestran nombre+blurb+fuente.
  const sources = part ? [...new Set(part.dims.map((d) => d.source))] : region ? [region.source] : []
  const hasBlurb = part?.blurb || !!region
  const u = t(`canon.units.${unit}`)
  // Alto físico de la región (escala con la altura elegida) — ancla la ficha a
  // la medida real replicable, no solo a la imagen.
  const regionCm = bbox ? bbox.h * figure.heightCm : null

  return (
    <div className="flex flex-col gap-2 rounded-md border border-[var(--color-primary)]/30 bg-[var(--color-surface-container)] p-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-label-sm uppercase tracking-wider text-[var(--color-primary)]">
          {t(`canon.part.names.${partKey}`)}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="flex cursor-pointer items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[var(--color-on-surface-variant)] transition-colors hover:text-[var(--color-primary)]"
        >
          <span className="material-symbols-outlined text-[14px] leading-none">arrow_back</span>
          {t('canon.part.backToBody')}
        </button>
      </div>

      {dedicated ? (
        <div className="relative w-full overflow-hidden rounded-sm bg-[var(--color-surface-dim)]" style={{ aspectRatio: '1 / 1' }}>
          <Image src={dedicated} alt={t(`canon.part.names.${partKey}`)} fill sizes="280px" className="object-contain" />
        </div>
      ) : bbox ? (
        <figure className="m-0 flex flex-col gap-1">
          {/* Zoom CSS a la región: bg-size/position derivados del bbox del path. */}
          <div
            className="w-full rounded-sm bg-[var(--color-surface-dim)]"
            style={{
              aspectRatio: `${bbox.w * dims.w} / ${bbox.h * dims.h}`,
              maxHeight: 220,
              backgroundImage: `url(${figureSrc(figure.canonId, view)})`,
              backgroundSize: `${100 / bbox.w}% ${100 / bbox.h}%`,
              backgroundPosition: `${bbox.w >= 1 ? 50 : (bbox.x / (1 - bbox.w)) * 100}% ${bbox.h >= 1 ? 50 : (bbox.y / (1 - bbox.h)) * 100}%`,
              backgroundRepeat: 'no-repeat',
            }}
            role="img"
            aria-label={t(`canon.part.names.${partKey}`)}
          />
          <figcaption className="font-mono text-[9px] uppercase tracking-wider text-[var(--color-on-surface-variant)]/60">
            {t('canon.part.fallbackNote')}
            {regionCm !== null && ` · ${formatValue(regionCm, unit, figure.headCm)} ${u}`}
          </figcaption>
        </figure>
      ) : (
        // Sin lámina dedicada ni región trazada en ESTA vista (la parte no se ve
        // desde aquí, o aún no está trazada). La ficha persiste con su dato.
        <p className="rounded-sm bg-[var(--color-surface-dim)] px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider text-[var(--color-on-surface-variant)]/70">
          {t('canon.part.notInView')}
        </p>
      )}

      {hasBlurb && (
        <p className="font-sans text-[11px] leading-snug text-[var(--color-on-surface)]">
          {t(`canon.part.blurb.${partKey}`)}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-1">
        {sources.map((s) => (
          <SourceBadge key={s} source={s} />
        ))}
      </div>
    </div>
  )
}
