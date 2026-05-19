type T = (key: string, vars?: Record<string, string | number>) => string

interface Props {
  title: string
  count: number
  subtitle?: string
  t: T
}

export function ArtworkSectionHeader({ title, count, subtitle, t }: Props) {
  return (
    <header className="flex items-end justify-between gap-4 mt-6 mb-4 pb-3 border-b border-[var(--color-outline-variant)]">
      <div className="flex items-baseline gap-3 min-w-0">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--color-on-surface-variant)] opacity-70 shrink-0">
          ─
        </span>
        <h2 className="font-sans font-semibold text-[var(--color-primary)] tracking-tight text-xl sm:text-2xl leading-none truncate">
          {title}
        </h2>
        {subtitle && (
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-on-surface-variant)] opacity-70 hidden sm:block">
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex items-baseline gap-2 shrink-0">
        <span className="font-mono text-2xl sm:text-3xl font-light text-[var(--color-primary)] leading-none tabular-nums">
          {String(count).padStart(2, '0')}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--color-on-surface-variant)] opacity-70">
          {t('profile.registeredWorks')}
        </span>
      </div>
    </header>
  )
}
