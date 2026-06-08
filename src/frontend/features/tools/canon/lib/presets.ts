// Presets de la herramienta Canon, persistidos en localStorage. Config liviana
// (canon, altura, vista, unidad, capas); las láminas/medidas se derivan de ahí.
// Sin backend: es preferencia local del usuario.

import type { Unit } from '@shared/lib/canon/units'
import type { View } from './figureMeta'
import type { ChartLayers } from './chartLayers'

export interface CanonConfig {
  canonId: string
  height: number
  view: View
  unit: Unit
  layers: ChartLayers
}

export interface CanonPreset extends CanonConfig {
  id: string
  name: string
}

const KEY = 'canon:presets'
const LAST_KEY = 'canon:last'

// Capas con forma válida (presets viejos pueden traer otra estructura).
// canon/anatomy ON salvo que se hayan apagado; las extra (skeleton/muscles/
// joints) OFF salvo que estén explícitamente ON.
function normalizeLayers(l: unknown): ChartLayers {
  const o = (l ?? {}) as Record<string, unknown>
  return {
    canon: o.canon !== false,
    anatomy: o.anatomy !== false,
    widths: o.widths === true,
    skeleton: o.skeleton === true,
    muscles: o.muscles === true,
    joints: o.joints === true,
  }
}

function read(): CanonPreset[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    return parsed.map((p: CanonPreset) => ({ ...p, layers: normalizeLayers(p.layers) }))
  } catch {
    return []
  }
}

function write(list: CanonPreset[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* cuota llena / modo privado: se ignora */
  }
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/** Lista los presets guardados (vacío en SSR). */
export function listPresets(): CanonPreset[] {
  return read()
}

/** Guarda un preset nuevo con la config dada y devuelve la lista actualizada. */
export function savePreset(name: string, config: CanonConfig): CanonPreset[] {
  const list = read()
  list.push({ ...config, id: newId(), name })
  write(list)
  return list
}

/** Borra un preset por id y devuelve la lista actualizada. */
export function deletePreset(id: string): CanonPreset[] {
  const list = read().filter((p) => p.id !== id)
  write(list)
  return list
}

/** Última config usada (para restaurar al recargar). `null` si no hay/SSR. */
export function loadLastConfig(): CanonConfig | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(LAST_KEY)
    if (!raw) return null
    const c = JSON.parse(raw) as CanonConfig
    if (typeof c?.canonId !== 'string' || typeof c?.height !== 'number') return null
    return { ...c, layers: normalizeLayers(c.layers) }
  } catch {
    return null
  }
}

/** Guarda la config actual como "última" (autosave de sesión). */
export function saveLastConfig(config: CanonConfig): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LAST_KEY, JSON.stringify(config))
  } catch {
    /* ignora */
  }
}
