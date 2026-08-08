'use client'

import { getPartHits } from '@shared/lib/canon/partHits'
import { muscleColor } from '@shared/lib/canon/muscleColors'
import { type View } from '../lib/figureMeta'

/**
 * Capa "Músculos": pinta las regiones de `partHits` rellenas con el color de su
 * grupo muscular (tomado del écorché de referencia, ver `muscleColors.ts`). Es
 * SOLO display (pointer-events none) → va DEBAJO de `PartHitLayer`, que sigue
 * capturando hover/clic. Mismo bbox que la figura (inset-0 + viewBox 0 0 1 1
 * sin preservar aspecto) → calza pixel a pixel a cualquier zoom.
 */
export default function MuscleMapLayer({ canonId, view }: { canonId: string; view: View }) {
  const entries = Object.entries(getPartHits(canonId, view))
  if (!entries.length) return null
  return (
    <svg
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
    >
      {entries.map(([key, hit]) => (
        <path
          key={key}
          d={hit.path}
          fill={muscleColor(key, view)}
          fillOpacity={0.55}
          stroke={muscleColor(key, view)}
          strokeOpacity={0.55}
          strokeWidth={2.5}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  )
}
