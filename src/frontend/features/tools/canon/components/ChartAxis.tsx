'use client'

import type { DivisionMark } from '@shared/lib/canon/landmarks'

/** Columna derecha del chart: números de división (1..N) + bracket ALTURA TOTAL.
 *  Solo Capa Canon. Separado de `ProportionChart` por límite de líneas. */
export default function ChartAxis({
  show,
  divisions,
  mapFrac,
  figTop,
  figBot,
  divisionLabel,
  heightLabel,
  heightValue,
}: {
  show: boolean
  divisions: DivisionMark[]
  mapFrac: (frac: number) => number
  figTop: number
  figBot: number
  divisionLabel: string
  heightLabel: string
  heightValue: string
}) {
  return (
    <div className="relative w-20 sm:w-28 shrink-0 flex">
      <div className="relative flex-grow">
        {show && (
          <>
            <span className="absolute right-1 top-0 font-mono text-[9px] uppercase tracking-widest text-[var(--color-on-surface-variant)]">
              {divisionLabel}
            </span>
            {divisions.map((d) => (
              <span
                key={`n-${d.label}`}
                className="absolute right-1 -translate-y-1/2 font-mono text-[10px] sm:text-label-sm text-[var(--color-on-surface-variant)]"
                style={{ top: `${mapFrac(d.frac)}%` }}
              >
                {d.label}
              </span>
            ))}
          </>
        )}
      </div>

      <div className="relative w-6 sm:w-8" style={{ marginTop: `${figTop}%`, marginBottom: `${100 - figBot}%` }}>
        {show && (
          <>
            <div className="absolute inset-y-0 left-1/2 border-l border-[var(--color-primary)]" />
            <div className="absolute top-0 left-1/2 right-0 border-t border-[var(--color-primary)]" />
            <div className="absolute bottom-0 left-1/2 right-0 border-t border-[var(--color-primary)]" />
            <div className="absolute top-1/2 left-1/2 ml-2 -translate-y-1/2 whitespace-nowrap [writing-mode:vertical-rl] rotate-180">
              <span className="font-mono text-[9px] sm:text-[11px] uppercase tracking-widest text-[var(--color-primary)]">
                {heightLabel} · {heightValue}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
