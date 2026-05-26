'use client'

import AppShell from '@/components/layout/AppShell'
import ToolActiveLayout from '@/components/tools/ToolActiveLayout'
import { usePreferences } from '@/components/AppPreferencesProvider'
import { useMemo, useState } from 'react'
import { MEDIUMS, getMedium } from '@/lib/mediums'
import {
  mixColors,
  hexToRgb,
  rgbToHex,
  rgbToCmyk,
  rgbToHsl,
  rgbToLab,
  isMuddy,
  type Pigment,
} from '@/lib/colorMix'

type Slot = { hex: string; name: string; weight: number }

export default function MezclaPage() {
  const { locale } = usePreferences()
  const L = locale === 'es'
    ? {
        medium: 'MEDIO',
        palette: 'PALETA',
        pigments: 'PIGMENTOS',
        addPigment: 'AÑADIR PIGMENTO',
        result: 'RESULTADO',
        copy: 'COPIAR',
        copied: 'COPIADO',
        clear: 'LIMPIAR',
        history: 'HISTORIAL',
        save: 'GUARDAR EN PALETA',
        muddy: 'Advertencia: mezcla fangosa, baja saturación',
        empty: 'Selecciona pigmentos de la paleta',
        proportion: 'PROPORCIÓN',
      }
    : {
        medium: 'MEDIUM',
        palette: 'PALETTE',
        pigments: 'PIGMENTS',
        addPigment: 'ADD PIGMENT',
        result: 'RESULT',
        copy: 'COPY',
        copied: 'COPIED',
        clear: 'CLEAR',
        history: 'HISTORY',
        save: 'SAVE TO PALETTE',
        muddy: 'Warning: muddy mix, low saturation',
        empty: 'Select pigments from the palette',
        proportion: 'PROPORTION',
      }

  const [mediumId, setMediumId] = useState('oil')
  const medium = getMedium(mediumId)
  const [slots, setSlots] = useState<Slot[]>([])
  const [history, setHistory] = useState<string[]>([])
  const [savedPalette, setSavedPalette] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

  const pigments: Pigment[] = slots.map((s) => ({ hex: s.hex, weight: s.weight }))
  const totalWeight = slots.reduce((s, x) => s + x.weight, 0) || 1
  const resultRgb = useMemo(() => mixColors(pigments, medium.model), [slots, medium.model])
  const resultHex = rgbToHex(resultRgb)
  const cmyk = rgbToCmyk(resultRgb)
  const hsl = rgbToHsl(resultRgb)
  const lab = rgbToLab(resultRgb)
  const muddy = slots.length >= 2 && isMuddy(resultRgb)

  const addPigment = (sw: { name: string; hex: string }) => {
    if (slots.length >= 6) return
    if (slots.some((s) => s.hex === sw.hex)) return
    setSlots([...slots, { ...sw, weight: 50 }])
  }
  const removeSlot = (i: number) => setSlots(slots.filter((_, idx) => idx !== i))
  const setWeight = (i: number, w: number) =>
    setSlots(slots.map((s, idx) => (idx === i ? { ...s, weight: w } : s)))
  const clearAll = () => setSlots([])
  const commitHistory = () => {
    if (slots.length < 2) return
    setHistory((h) => [resultHex, ...h.filter((c) => c !== resultHex)].slice(0, 8))
  }
  const copyHex = () => {
    navigator.clipboard.writeText(resultHex)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }
  const saveToPalette = () => {
    setSavedPalette((p) => [resultHex, ...p.filter((c) => c !== resultHex)].slice(0, 16))
    commitHistory()
  }

  const textureBg =
    medium.texture === 'canvas'
      ? 'bg-[radial-gradient(rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[length:20px_20px]'
      : medium.texture === 'paper-grain'
      ? 'bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:6px_6px]'
      : medium.texture === 'glossy'
      ? 'bg-gradient-to-br from-white/[0.02] to-black/[0.05]'
      : ''

  return (
    <AppShell>
      <ToolActiveLayout>
        {/* Top Control Bar */}
        <div className="h-16 bg-[var(--color-surface-container)] border-b border-[var(--color-outline-variant)] flex items-center px-4 z-40 shrink-0 overflow-x-auto gap-4">
          <span className="font-mono text-[var(--text-label-sm)] text-[var(--color-secondary)] uppercase tracking-widest whitespace-nowrap">
            {L.medium}
          </span>
          <select
            value={mediumId}
            onChange={(e) => {
              setMediumId(e.target.value)
              setSlots([])
            }}
            className="bg-[var(--color-surface-container-high)] border border-[var(--color-outline)] rounded px-3 py-1.5 font-mono text-[var(--text-label-sm)] uppercase tracking-widest text-[var(--color-on-surface)] hover:border-[var(--color-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          >
            {MEDIUMS.map((m) => (
              <option key={m.id} value={m.id}>
                {locale === 'es' ? m.nameEs : m.nameEn}
              </option>
            ))}
          </select>

          <div className="w-px h-6 bg-[var(--color-outline-variant)]" />

          <span className="font-mono text-[10px] text-[var(--color-on-surface-variant)] uppercase tracking-widest">
            {medium.model}
          </span>

          <div className="ml-auto flex gap-2">
            <button
              onClick={clearAll}
              disabled={slots.length === 0}
              className="font-mono text-[var(--text-label-sm)] uppercase tracking-widest px-3 py-1.5 border border-[var(--color-outline)] rounded text-[var(--color-on-surface-variant)] hover:border-[var(--color-error)] hover:text-[var(--color-error)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {L.clear}
            </button>
          </div>
        </div>

        {/* Workspace */}
        <div className={`flex-1 bg-[var(--color-surface-container-lowest)] flex flex-col overflow-y-auto relative min-h-0 ${textureBg}`}>
          {/* Result + Pigments area */}
          <div className="flex-1 flex flex-col lg:flex-row gap-8 p-8 items-center justify-center min-h-[420px]">
            {/* Pigments stack */}
            <div className="flex-1 flex flex-col gap-4 max-w-xl w-full">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[var(--text-label-sm)] text-[var(--color-secondary)] uppercase tracking-widest">
                  {L.pigments} · {slots.length}/6
                </span>
              </div>

              {slots.length === 0 && (
                <div className="border border-dashed border-[var(--color-outline-variant)] rounded-lg p-12 text-center font-mono text-[var(--text-label-sm)] text-[var(--color-on-surface-variant)] uppercase tracking-widest opacity-60">
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
                        <span className="font-mono text-[var(--text-label-sm)] uppercase tracking-widest text-[var(--color-on-surface)] truncate">
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

            {/* Result orb */}
            <div className="flex flex-col items-center gap-4">
              <span className="font-mono text-[var(--text-label-sm)] text-[var(--color-secondary)] uppercase tracking-widest">
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
                  onClick={copyHex}
                  className="font-mono text-[var(--text-label-sm)] text-[var(--color-primary)] uppercase tracking-widest hover:text-[var(--color-primary)] flex items-center gap-2"
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
                  onClick={saveToPalette}
                  disabled={slots.length < 2}
                  className="mt-2 font-mono text-[var(--text-label-sm)] uppercase tracking-widest px-3 py-1.5 border border-[var(--color-outline)] rounded text-[var(--color-on-surface)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  {L.save}
                </button>
              </div>
            </div>
          </div>

          {/* History */}
          {(history.length > 0 || savedPalette.length > 0) && (
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
          )}

          {/* Palette dock */}
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
        </div>
      </ToolActiveLayout>
    </AppShell>
  )
}

function clampByte(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)))
}
function lighten(hex: string, pct: number): string {
  const { r, g, b } = hexToRgb(hex)
  const f = pct / 100
  return rgbToHex({
    r: clampByte(r + (255 - r) * f),
    g: clampByte(g + (255 - g) * f),
    b: clampByte(b + (255 - b) * f),
  })
}
function darken(hex: string, pct: number): string {
  const { r, g, b } = hexToRgb(hex)
  const f = 1 - pct / 100
  return rgbToHex({ r: clampByte(r * f), g: clampByte(g * f), b: clampByte(b * f) })
}
