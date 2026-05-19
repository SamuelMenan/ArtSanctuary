'use client'

interface Props {
  id: string
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  label: string
  hint?: string
}

export function Toggle({ id, checked, onChange, disabled, label, hint }: Props) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-[var(--color-outline-variant)] last:border-b-0">
      <div className="flex-1 min-w-0">
        <label
          htmlFor={id}
          className="font-sans text-[var(--color-primary)] font-medium cursor-pointer"
        >
          {label}
        </label>
        {hint && (
          <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">{hint}</p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-surface)] disabled:opacity-50 disabled:cursor-not-allowed ${
          checked
            ? 'bg-[var(--color-primary)]'
            : 'bg-[var(--color-surface-container-high)] border border-[var(--color-outline-variant)]'
        }`}
      >
        <span className="sr-only">{label}</span>
        <span
          aria-hidden
          className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
            checked
              ? 'translate-x-6 bg-[var(--color-on-primary)]'
              : 'translate-x-1 bg-[var(--color-on-surface-variant)]'
          }`}
        />
      </button>
    </div>
  )
}
