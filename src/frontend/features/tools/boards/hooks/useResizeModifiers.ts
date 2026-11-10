'use client'

// Modificadores de teclado del redimensionado del Transformer.
//
// Konva ya trae dos conductas nativas (`Transformer._handleMouseMove`):
//   · Shift → proporción, si `shiftBehavior` es 'default'
//   · Alt   → crecer desde el centro (`centeredScaling || e.altKey`)
// Este board invierte la primera: Shift crece desde el CENTRO. Para eso el
// Transformer se monta con `shiftBehavior="none"` (que apaga el Shift nativo) y
// la prop `centeredScaling` se alimenta desde aquí. Alt sigue centrando por su
// cuenta —es nativo y no hay prop para apagarlo—, así que queda como alias.
// La proporción se mantiene en Ctrl/⌘, que era su único acceso.

import { useEffect, useState } from 'react'

export type ResizeModifiers = {
  /** Ctrl/⌘: conserva la proporción original de la caja. */
  keepRatio: boolean
  /** Shift: la caja crece desde su centro (los 4 lados por igual). */
  centered: boolean
}

export const NO_MODIFIERS: ResizeModifiers = { keepRatio: false, centered: false }

/**
 * Lee el estado de los modificadores de un evento de teclado.
 *
 * Se leen las BANDERAS del evento (`ctrlKey`/`shiftKey`), no el nombre de la
 * tecla: así cualquier evento posterior corrige el estado aunque nos hayamos
 * perdido un `keyup`, y da igual qué tecla concreta se pulse.
 */
export function readResizeModifiers(e: Pick<KeyboardEvent, 'ctrlKey' | 'metaKey' | 'shiftKey'>): ResizeModifiers {
  return { keepRatio: e.ctrlKey || e.metaKey, centered: e.shiftKey }
}

/** ¿Son el mismo estado? (evita re-renders del Stage en cada tecla). */
export function sameModifiers(a: ResizeModifiers, b: ResizeModifiers): boolean {
  return a.keepRatio === b.keepRatio && a.centered === b.centered
}

/**
 * Estado vivo de los modificadores mientras el board tiene el foco.
 *
 * Escucha también `blur`: si la tecla se suelta FUERA de la ventana (Alt+Tab, o
 * cualquier atajo del navegador que se lleve el foco) el `keyup` no llega nunca
 * y el modo se quedaría pegado sin nada que lo indique en pantalla.
 */
export function useResizeModifiers(): ResizeModifiers {
  const [mods, setMods] = useState<ResizeModifiers>(NO_MODIFIERS)

  useEffect(() => {
    // Devolver el MISMO objeto cuando no cambia nada hace que React descarte el
    // re-render: si no, cada pulsación redibujaría el Stage entero.
    const sync = (e: KeyboardEvent) => {
      const next = readResizeModifiers(e)
      setMods((prev) => (sameModifiers(prev, next) ? prev : next))
    }
    const reset = () => setMods((prev) => (sameModifiers(prev, NO_MODIFIERS) ? prev : NO_MODIFIERS))

    window.addEventListener('keydown', sync)
    window.addEventListener('keyup', sync)
    window.addEventListener('blur', reset)
    return () => {
      window.removeEventListener('keydown', sync)
      window.removeEventListener('keyup', sync)
      window.removeEventListener('blur', reset)
    }
  }, [])

  return mods
}
