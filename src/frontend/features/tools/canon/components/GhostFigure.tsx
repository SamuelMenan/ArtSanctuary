'use client'

import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { getCanon } from '@shared/lib/canon/canons'
import { divisionMarks } from '@shared/lib/canon/landmarks'
import ReferenceFigure from './ReferenceFigure'
import { type View } from '../lib/figureMeta'

/** Superpone OTRO canon como "fantasma" translúcido sobre la figura principal,
 *  centrado y a la misma caja (coronilla→planta), para ver directo la diferencia
 *  (p.ej. largo de pierna 7.5 vs 8.5). Sus divisiones van en color secundario. */
export default function GhostFigure({ canonId, view }: { canonId: string; view: View }) {
  const { t } = usePreferences()
  const divisions = divisionMarks(getCanon(canonId).headCount)
  return (
    <div className="pointer-events-none absolute inset-0 flex justify-center opacity-40">
      <div className="relative h-full">
        <ReferenceFigure canonId={canonId} view={view} alt={t('canon.referenceAlt')} className="h-full w-auto grayscale" />
        <div className="absolute inset-0">
          {divisions.map((d) => (
            <div
              key={`ghost-${d.label}`}
              className="absolute left-0 right-0 border-t border-dashed border-[var(--color-secondary)]"
              style={{ top: `${d.frac * 100}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
