'use client'

import type { Medium } from '@shared/lib/mediums'
import { lighten, darken, type Slot, type MixLabels } from '../colorMixHelpers'

interface PaletteDockProps {
  L: MixLabels
  locale: string
  medium: Medium
  slots: Slot[]
  addPigment: (sw: { name: string; hex: string }) => void
}

export default function PaletteDock({ L, locale, medium, slots, addPigment }: PaletteDockProps) {
  return (
    <div className="sticky bottom-0 bg-[var(--color-surface)]/85 backdrop-blur-md border-t border-[var(--color-outline-variant)] p-4 flex flex-col gap-2">
      <span className="font-mono text-[10px] text-[var(--color-secondary)] uppercase tracking-widest">
        {L.palette} · {locale === 'es' ? medium.nameEs : medium.nameEn}
      </span>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {medium.palette.map((sw) => {
          const active = slots.some((s) => s.hex === sw.hex)
          return (
            <button
              key={sw.hex}
              onClick={() => addPigment(sw)}
              disabled={active || slots.length >= 6}
              title={sw.name}
              className={`size-14 rounded-full shrink-0 relative group ring-1 transition-all ${
                active
                  ? 'ring-2 ring-[var(--color-primary)] shadow-[0_0_20px_rgba(var(--color-primary-rgb,255,255,255),0.3)]'
                  : 'ring-white/10 hover:ring-[var(--color-primary)]/60 hover:scale-110'
              } disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100`}
              style={{
                background: `radial-gradient(circle at 30% 30%, ${lighten(sw.hex, 15)}, ${sw.hex} 60%, ${darken(sw.hex, 20)})`,
              }}
            >
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] text-[var(--color-on-surface-variant)] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {sw.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
