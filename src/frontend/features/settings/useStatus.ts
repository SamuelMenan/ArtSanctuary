'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string; fields?: Record<string, string> }

export function useStatus(autoResetMs = 3500) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const set = useCallback((next: Status) => {
    if (timer.current) clearTimeout(timer.current)
    setStatus(next)
    if (next.kind === 'success' && autoResetMs > 0) {
      timer.current = setTimeout(() => setStatus({ kind: 'idle' }), autoResetMs)
    }
  }, [autoResetMs])

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  return { status, set }
}
