import { useEffect, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'

type Vec = { x: number; y: number }

export interface GridSnapshot {
  realWidthCm: number
  squareCm: number
  opacity: number
  color: string
  showNumbers: boolean
  pan: Vec
  zoom: number
}

interface GridSetters {
  setRealWidthCm: Dispatch<SetStateAction<number>>
  setSquareCm: Dispatch<SetStateAction<number>>
  setOpacity: Dispatch<SetStateAction<number>>
  setColor: Dispatch<SetStateAction<string>>
  setShowNumbers: Dispatch<SetStateAction<boolean>>
  setPan: Dispatch<SetStateAction<Vec>>
  setZoom: Dispatch<SetStateAction<number>>
}

/**
 * Historial undo/redo de la cuadrícula sobre snapshots del estado completo
 * (medidas, estilo, pan/zoom). Incluye los atajos Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y.
 * `pushSnapshot` admite un override para capturar el valor *previo* a un cambio
 * continuo (slider/color) antes de aplicarlo.
 */
export function useGridHistory(state: GridSnapshot, setters: GridSetters) {
  const currentState = useRef<GridSnapshot>(state)
  currentState.current = state

  const pastData = useRef<GridSnapshot[]>([])
  const futureData = useRef<GridSnapshot[]>([])
  const [, setHistoryTick] = useState(0)

  const pushSnapshot = (override?: Partial<GridSnapshot>) => {
    pastData.current.push({ ...currentState.current, ...override })
    if (pastData.current.length > 20) pastData.current.shift()
    futureData.current = []
    setHistoryTick((t) => t + 1)
  }

  const applyState = (s: GridSnapshot) => {
    setters.setRealWidthCm(s.realWidthCm)
    setters.setSquareCm(s.squareCm)
    setters.setOpacity(s.opacity)
    setters.setColor(s.color)
    setters.setShowNumbers(s.showNumbers)
    setters.setPan(s.pan)
    setters.setZoom(s.zoom)
  }

  const undo = () => {
    if (pastData.current.length === 0) return
    futureData.current.push(currentState.current)
    applyState(pastData.current.pop()!)
    setHistoryTick((t) => t + 1)
  }
  const redo = () => {
    if (futureData.current.length === 0) return
    pastData.current.push(currentState.current)
    applyState(futureData.current.pop()!)
    setHistoryTick((t) => t + 1)
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT') return
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { pushSnapshot, undo, redo, pastData, futureData }
}
