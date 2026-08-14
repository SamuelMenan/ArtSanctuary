'use client'

interface AuthAsideProps {
  t: (key: string) => string
}

/** Panel decorativo lateral (solo escritorio) compartido por Login y Registro. */
export default function AuthAside({ t }: AuthAsideProps) {
  return (
    <div className="hidden md:flex md:w-1/2 bg-[var(--color-surface)] flex-col justify-center items-center relative overflow-hidden p-[var(--spacing-container-padding)] border-r border-[var(--color-outline-variant)]">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10 grayscale mix-blend-overlay"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?auto=format&fit=crop&q=80')" }}
      />
      <div className="relative z-10 text-center max-w-md mx-auto">
        <h1 className="font-display-lg text-display-lg leading-[1.1] tracking-[-0.02em] text-[var(--color-primary)] font-semibold mb-6">
          ArtSanctuary
        </h1>
        <p className="font-mono text-label-sm tracking-[0.05em] text-[var(--color-secondary)] uppercase mb-4 font-medium">
          {t('home.heroLabel')}
        </p>
        <p className="font-sans text-body-md text-[var(--color-on-surface-variant)] italic">
          {t('home.heroTitle')}
        </p>
      </div>
      <div className="absolute bottom-[var(--spacing-container-padding)] left-[var(--spacing-container-padding)]">
        <p className="font-mono text-label-sm text-[var(--color-outline-variant)]">{t('auth.asideTagline')}</p>
      </div>
    </div>
  )
}

/** Encabezado de marca para móvil, compartido por Login y Registro. */
export function AuthMobileHeader({ t }: AuthAsideProps) {
  return (
    <div className="md:hidden text-center mb-12">
      <h1 className="font-display-lg text-display-lg leading-[1.1] tracking-[-0.02em] text-[var(--color-primary)] font-semibold mb-4">
        ArtSanctuary
      </h1>
      <p className="font-mono text-label-sm tracking-[0.05em] text-[var(--color-secondary)] uppercase font-medium">
        {t('home.heroLabel')}
      </p>
    </div>
  )
}
