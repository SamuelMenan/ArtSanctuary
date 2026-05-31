'use client'

import { lighten, darken, type MixLabels } from '../colorMixHelpers'

interface MixHistoryProps {
  L: MixLabels
  history: string[]
  savedPalette: string[]
}

export default function MixHistory({ L, history, savedPalette }: MixHistoryProps) {
  if (history.length === 0 && savedPalette.length === 0) return null

  return (
    <div className="px-8 pb-4 flex flex-col gap-3">
      {history.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-[var(--color-on-surface-variant)] uppercase tracking-widest shrink-0">
            {L.history}
          </span>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {history.map((h, i) => (
              <button
                key={`${h}-${i}`}
                className="size-8 rounded-full shrink-0 ring-1 ring-white/10 hover:scale-110 transition-transform"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${lighten(h, 15)}, ${h} 60%, ${darken(h, 20)})`,
                }}
                title={h}
              />
            ))}
          </div>
        </div>
      )}
      {savedPalette.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-[var(--color-on-surface-variant)] uppercase tracking-widest shrink-0">
            {L.save}
          </span>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {savedPalette.map((h, i) => (
              <button
                key={`${h}-${i}`}
                className="size-8 rounded shrink-0 ring-1 ring-white/10 hover:scale-110 transition-transform"
                style={{ background: h }}
                title={h}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
