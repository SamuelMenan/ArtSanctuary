'use client'

import {
  rgbToCmyk,
  rgbToHsl,
  rgbToLab,
  type RGB,
} from '@shared/lib/colorMix'
import { lighten, darken, type MixLabels } from '../colorMixHelpers'

interface ResultOrbProps {
  L: MixLabels
  resultRgb: RGB
  resultHex: string
  cmyk: ReturnType<typeof rgbToCmyk>
  hsl: ReturnType<typeof rgbToHsl>
  lab: ReturnType<typeof rgbToLab>
  muddy: boolean
  copied: boolean
  slotsCount: number
  copyHex: () => void
  saveToPalette: () => void
}

export default function ResultOrb({
  L,
  resultRgb,
  resultHex,
  cmyk,
  hsl,
  lab,
  muddy,
  copied,
  slotsCount,
  copyHex,
  saveToPalette,
}: ResultOrbProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <span className="font-mono text-label-sm text-[var(--color-secondary)] uppercase tracking-widest">
        {L.result}
      </span>
      <div className="relative">
        <div
          className="absolute inset-0 rounded-full blur-3xl opacity-50 scale-110"
          style={{ background: resultHex }}
        />
        <div
          className="relative w-[240px] h-[240px] rounded-full shadow-[inset_0_4px_24px_rgba(255,255,255,0.2),inset_0_-12px_40px_rgba(0,0,0,0.4),0_20px_60px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/10 transition-all duration-300"
          style={{
            background: `radial-gradient(circle at 35% 30%, ${lighten(resultHex, 20)}, ${resultHex} 55%, ${darken(resultHex, 25)})`,
          }}
        >
          <div className="absolute inset-0 rounded-full opacity-[0.06] mix-blend-overlay bg-[radial-gradient(circle,rgba(255,255,255,0.4)_0,transparent_70%)]" />
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 mt-2">
        <button
          type="button"
          onClick={copyHex}
          className="font-mono text-label-sm text-[var(--color-primary)] uppercase tracking-widest hover:text-[var(--color-primary)] flex items-center gap-2"
        >
          {resultHex}
          <span className="material-symbols-outlined text-[14px]">
            {copied ? 'check' : 'content_copy'}
          </span>
        </button>
        <div className="font-mono text-[10px] text-[var(--color-on-surface-variant)] uppercase tracking-widest space-y-0.5 text-center">
          <div>RGB {Math.round(resultRgb.r)} · {Math.round(resultRgb.g)} · {Math.round(resultRgb.b)}</div>
          <div>CMYK {cmyk.c} · {cmyk.m} · {cmyk.y} · {cmyk.k}</div>
          <div>HSL {hsl.h} · {hsl.s}% · {hsl.l}%</div>
          <div>LAB {lab.l} · {lab.a} · {lab.b}</div>
        </div>
        {muddy && (
          <span className="font-mono text-[10px] text-[var(--color-error)] uppercase tracking-widest mt-1 text-center max-w-[200px]">
            ⚠ {L.muddy}
          </span>
        )}
        <button
          type="button"
          onClick={saveToPalette}
          disabled={slotsCount < 2}
          className="mt-2 font-mono text-label-sm uppercase tracking-widest px-3 py-1.5 border border-[var(--color-outline)] rounded text-[var(--color-on-surface)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {L.save}
        </button>
      </div>
    </div>
  )
}
