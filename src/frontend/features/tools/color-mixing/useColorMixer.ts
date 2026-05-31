'use client'

import { useMemo, useState } from 'react'
import { getMedium } from '@shared/lib/mediums'
import {
  mixColors,
  rgbToHex,
  rgbToCmyk,
  rgbToHsl,
  rgbToLab,
  isMuddy,
  type Pigment,
} from '@shared/lib/colorMix'
import type { Slot } from './colorMixHelpers'

export function useColorMixer() {
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

  const changeMedium = (id: string) => {
    setMediumId(id)
    setSlots([])
  }

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

  return {
    mediumId,
    medium,
    slots,
    history,
    savedPalette,
    copied,
    totalWeight,
    resultRgb,
    resultHex,
    cmyk,
    hsl,
    lab,
    muddy,
    textureBg,
    changeMedium,
    addPigment,
    removeSlot,
    setWeight,
    clearAll,
    copyHex,
    saveToPalette,
  }
}
