'use client'

import { lighten, darken, type Slot, type MixLabels } from '../colorMixHelpers'

interface PigmentStackProps {
  L: MixLabels
  slots: Slot[]
  totalWeight: number
  setWeight: (i: number, w: number) => void
  removeSlot: (i: number) => void
}

export default function PigmentStack({ L, slots, totalWeight, setWeight, removeSlot }: PigmentStackProps) {
  return (
    <div className="flex-1 flex flex-col gap-4 max-w-xl w-full">
      <div className="flex items-center justify-between">
        <span className="font-mono text-label-sm text-[var(--color-secondary)] uppercase tracking-widest">
          {L.pigments} · {slots.length}/6
        </span>
      </div>

      {slots.length === 0 && (
        <div className="border border-dashed border-[var(--color-outline-variant)] rounded-lg p-12 text-center font-mono text-label-sm text-[var(--color-on-surface-variant)] uppercase tracking-widest opacity-60">
          {L.empty}
        </div>
      )}

      {slots.map((s, i) => {
        const pct = Math.round((s.weight / totalWeight) * 100)
        return (
          <div
            key={`${s.hex}-${i}`}
            className="flex items-center gap-4 bg-[var(--color-surface)]/40 backdrop-blur-sm border border-[var(--color-outline-variant)] rounded-lg p-3 group hover:border-[var(--color-primary)]/40 transition-colors"
          >
            <div
              className="size-12 rounded-full shrink-0 shadow-[inset_0_2px_8px_rgba(0,0,0,0.3),0_4px_16px_-4px_rgba(0,0,0,0.4)] ring-1 ring-white/10"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${lighten(s.hex, 15)}, ${s.hex} 60%, ${darken(s.hex, 20)})`,
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline gap-2 mb-1">
                <span className="font-mono text-label-sm uppercase tracking-widest text-[var(--color-on-surface)] truncate">
                  {s.name}
                </span>
                <span className="font-mono text-[10px] text-[var(--color-secondary)] tracking-widest shrink-0">
                  {pct}%
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={s.weight}
                onChange={(e) => setWeight(i, Number(e.target.value))}
                className="w-full custom-range accent-[var(--color-primary)]"
              />
            </div>
            <button
              onClick={() => removeSlot(i)}
              className="material-symbols-outlined text-[var(--color-on-surface-variant)] hover:text-[var(--color-error)] transition-colors opacity-0 group-hover:opacity-100 text-[18px]"
              title="remove"
            >
              close
            </button>
          </div>
        )
      })}
    </div>
  )
}
