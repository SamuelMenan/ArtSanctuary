import Image from 'next/image'
import { FollowStats } from './FollowStats'

type T = (key: string, vars?: Record<string, string | number>) => string

interface Props {
  userId: string
  name: string
  username: string
  avatarUrl?: string | null
  plan?: 'free' | 'pro'
  isOwner: boolean
  isMutual?: boolean
  worksCount: number
  followersCount: number
  followingCount: number
  email?: string | null
  showEmail?: boolean
  eyebrow?: string
  actions?: React.ReactNode
  t: T
}

export function ProfileHero({
  userId,
  name,
  username,
  avatarUrl,
  plan = 'free',
  isOwner,
  isMutual,
  worksCount,
  followersCount,
  followingCount,
  email,
  showEmail,
  eyebrow,
  actions,
  t,
}: Props) {
  const initial = (name || username || 'U').charAt(0).toUpperCase()
  const planLabel = plan === 'pro' ? 'PRO' : 'FREE'

  return (
    <header className="border border-[var(--color-outline-variant)] rounded-sm bg-[var(--color-surface-container-lowest)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-outline-variant)]">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--color-on-surface-variant)] opacity-80">
          {eyebrow ?? (isOwner ? 'TU SANTUARIO' : 'ARTISTA')}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--color-on-surface-variant)] opacity-50">
          ID · {userId.slice(-6).toUpperCase()}
        </span>
      </div>

      {/* Main row: avatar + identity + metrics */}
      <div className="flex flex-col lg:flex-row lg:items-stretch">
        <div className="flex items-start gap-4 sm:gap-5 p-4 sm:p-5 flex-1 min-w-0">
          {/* Avatar */}
          <div className="relative shrink-0">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={`Avatar de ${name}`}
                width={96}
                height={96}
                className="size-20 sm:size-24 rounded-full border border-[var(--color-outline-variant)] object-cover bg-[var(--color-surface-container-low)]"
              />
            ) : (
              <div className="size-20 sm:size-24 rounded-full bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)] flex items-center justify-center">
                <span className="font-sans text-4xl font-semibold text-[var(--color-primary)]">
                  {initial}
                </span>
              </div>
            )}
            <span className="absolute bottom-0.5 right-0.5 size-2.5 rounded-full bg-[var(--color-primary)] border-2 border-[var(--color-background)]" />
          </div>

          {/* Identity */}
          <div className="flex flex-col gap-2 min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 min-w-0">
              <h1
                className="font-sans font-semibold text-[var(--color-primary)] tracking-tight leading-none text-3xl sm:text-4xl truncate max-w-full"
                title={name}
              >
                {name}
              </h1>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-on-surface-variant)]">
                @{username}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Chip>{planLabel}</Chip>
              {isMutual && <Chip variant="accent">{t('profile.followsYou')}</Chip>}
              {(showEmail || isOwner) && email && (
                <Chip variant="muted" title={email}>
                  {email}
                </Chip>
              )}
            </div>

            {actions && (
              <div className="flex flex-wrap items-center gap-2 mt-2">{actions}</div>
            )}
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 lg:grid-cols-3 lg:w-[360px] border-t lg:border-t-0 lg:border-l border-[var(--color-outline-variant)] divide-x divide-[var(--color-outline-variant)] shrink-0">
          <Metric value={worksCount} label={t('profile.registeredWorks')} />
          <FollowStats
            userId={userId}
            followersCount={followersCount}
            followingCount={followingCount}
            layout="cells"
          />
        </div>
      </div>
    </header>
  )
}

const CHIP_MAP = {
  default: 'text-[var(--color-on-surface-variant)] border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)]',
  accent: 'text-[var(--color-primary)] border-[var(--color-primary)] bg-[var(--color-surface-container)]',
  muted: 'text-[var(--color-on-surface-variant)] border-transparent bg-[var(--color-surface-container)] opacity-80',
} as const

function Chip({
  children,
  variant = 'default',
  title,
}: {
  children: React.ReactNode
  variant?: 'default' | 'accent' | 'muted'
  title?: string
}) {
  const base =
    'inline-flex items-center font-mono text-[10px] uppercase tracking-[0.18em] px-2 py-0.5 rounded-sm border whitespace-nowrap max-w-full truncate leading-tight'
  
  return (
    <span className={`${base} ${CHIP_MAP[variant]}`} title={title}>
      {children}
    </span>
  )
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div className="px-3 py-3 flex flex-col gap-0.5 justify-center bg-[var(--color-surface-container-lowest)]">
      <span className="font-sans font-semibold text-xl text-[var(--color-primary)] leading-none tabular-nums">
        {value}
      </span>
      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--color-on-surface-variant)] opacity-70 truncate">
        {label}
      </span>
    </div>
  )
}
