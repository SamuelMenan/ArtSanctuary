import { useEffect } from 'react'
import type { Dispatch, SetStateAction } from 'react'

/**
 * Mantener la barra espaciadora pulsada activa el modo paneo temporal.
 * Ignora el espacio cuando el foco está en un input o textarea.
 */
export function useSpacePan(setSpaceHeld: Dispatch<SetStateAction<boolean>>) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      e.preventDefault()
      setSpaceHeld(true)
    }
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpaceHeld(false)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [setSpaceHeld])
}
