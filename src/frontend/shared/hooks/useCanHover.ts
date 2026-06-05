'use client'

import { useEffect, useState } from 'react'

/**
 * `true` si el dispositivo tiene puntero con hover (ratón). En táctil (`hover:
 * none`) devuelve `false` → los controles ocultos por hover deben mostrarse
 * siempre. SSR-safe: arranca en `true` y se corrige tras montar.
 */
export function useCanHover(): boolean {
  const [canHover, setCanHover] = useState(true)
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover)')
    const update = () => setCanHover(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return canHover
}
