import { labelCls } from '../formStyles'

export function Field({
  label,
  error,
  hint,
  id,
  children,
}: {
  label: string
  error?: string
  hint?: string
  id: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      {children}
      <div className="flex justify-between text-xs font-mono min-h-[1rem]">
        {error ? (
          <span className="text-[var(--color-error)]">{error}</span>
        ) : hint ? (
          <span className="text-[var(--color-on-surface-variant)] opacity-70">{hint}</span>
        ) : (
          <span />
        )}
      </div>
    </div>
  )
}
