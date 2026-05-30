import Link from 'next/link'

type T = (key: string, vars?: Record<string, string | number>) => string

interface Props {
  ownerView: boolean
  t: T
}

export function EmptyPortfolio({ ownerView, t }: Props) {
  return (
    <section className="relative border border-dashed border-[var(--color-outline-variant)] rounded-sm overflow-hidden">
      {/* Diagonal hatch pattern background */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, var(--color-on-surface) 0, var(--color-on-surface) 1px, transparent 1px, transparent 14px)',
        }}
      />
      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-10 p-10 sm:p-14">
        {/* Visual: stacked frames */}
        <div className="relative h-[200px] sm:h-[260px] flex items-center justify-center">
          <Frame style={{ transform: 'rotate(-6deg)', top: 10, left: 10 }} opacity={0.25} />
          <Frame style={{ transform: 'rotate(3deg)', top: -10, right: 0 }} opacity={0.4} />
          <Frame style={{ transform: 'rotate(-1deg)' }} opacity={0.7} primary />
        </div>

        {/* Copy */}
        <div className="flex flex-col justify-center gap-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--color-on-surface-variant)] opacity-70">
            — {ownerView ? 'ARCHIVO VACÍO' : 'PORTAFOLIO'}
          </span>
          <h3 className="font-sans font-semibold text-2xl sm:text-3xl text-[var(--color-primary)] tracking-tight leading-tight">
            {t('profile.noWorks')}
          </h3>
          <p className="font-sans text-[var(--color-on-surface-variant)] text-sm sm:text-base max-w-md leading-relaxed">
            {t('profile.noWorksBody')}
          </p>
          {ownerView && (
            <div className="mt-3">
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 bg-[var(--color-primary)] text-[var(--color-on-primary)] border border-[var(--color-outline)] shadow-[0_1px_0_var(--color-outline)] font-mono text-xs uppercase tracking-[0.2em] px-6 py-3 hover:bg-[var(--color-primary-container)] transition-colors rounded-sm"
              >
                <span aria-hidden>+</span>
                {t('profile.uploadFirst')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function Frame({
  style,
  opacity = 1,
  primary = false,
}: {
  style?: React.CSSProperties
  opacity?: number
  primary?: boolean
}) {
  return (
    <div
      aria-hidden
      style={{ ...style, opacity }}
      className={`absolute size-[140px] sm:size-[180px] border rounded-sm ${
        primary
          ? 'border-[var(--color-primary)] bg-[var(--color-surface-container-low)]'
          : 'border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)]'
      } flex items-center justify-center`}
    >
      <div className="size-3 rounded-full bg-[var(--color-on-surface-variant)] opacity-30" />
    </div>
  )
}
