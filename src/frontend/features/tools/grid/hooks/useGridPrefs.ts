import { useEffect } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { snapToSquare } from '../lib/gridGeometry'

interface GridPrefsBridge {
  opacity: number
  color: string
  showNumbers: boolean
  squareCm: number
  setOpacity: Dispatch<SetStateAction<number>>
  setColor: Dispatch<SetStateAction<string>>
  setShowNumbers: Dispatch<SetStateAction<boolean>>
  setSquareCm: Dispatch<SetStateAction<number>>
  setRealWidthCm: Dispatch<SetStateAction<number>>
}

/** Persiste y restaura las preferencias de la cuadrícula en localStorage. */
export function useGridPrefs(s: GridPrefsBridge) {
  // Cargar preferencias guardadas (una vez).
  useEffect(() => {
    try {
      const saved = localStorage.getItem('grid-prefs')
      if (saved) {
        const p = JSON.parse(saved)
        if (p.opacity !== undefined) s.setOpacity(p.opacity)
        if (p.color !== undefined) s.setColor(p.color)
        if (p.showNumbers !== undefined) s.setShowNumbers(p.showNumbers)
        if (p.squareCm !== undefined) {
          s.setSquareCm(p.squareCm)
          s.setRealWidthCm((w) => snapToSquare(w, p.squareCm))
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Guardar al cambiar.
  useEffect(() => {
    localStorage.setItem(
      'grid-prefs',
      JSON.stringify({ opacity: s.opacity, color: s.color, showNumbers: s.showNumbers, squareCm: s.squareCm }),
    )
  }, [s.opacity, s.color, s.showNumbers, s.squareCm])
}
