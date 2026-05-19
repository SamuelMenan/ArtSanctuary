'use client'

import type { Status } from './useStatus'

export function StatusBanner({ status }: { status: Status }) {
  if (status.kind === 'idle' || status.kind === 'loading') return null
  const isError = status.kind === 'error'
  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live="polite"
      className={`text-sm font-mono tracking-wide px-3 py-2 rounded-sm border ${
        isError
          ? 'text-[var(--color-error)] border-[var(--color-error-container)] bg-[var(--color-error-container)]/10'
          : 'text-[var(--color-primary)] border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)]'
      }`}
    >
      {status.message}
    </div>
  )
}
