import { SocialLinks } from './SocialLinks'

type T = (key: string, vars?: Record<string, string | number>) => string

interface Props {
  bio?: string | null
  location?: string | null
  website?: string | null
  createdAt?: Date | string | null
  socials?: {
    twitter?: string
    instagram?: string
    behance?: string
    artstation?: string
    tiktok?: string
  } | null
  locale?: string
  t: T
}

const formatters = new Map<string, Intl.DateTimeFormat>()
function getFormatter(locale: string) {
  const code = locale === 'en' ? 'en-US' : 'es-ES'
  if (!formatters.has(code)) {
    formatters.set(code, new Intl.DateTimeFormat(code, { year: 'numeric', month: 'short' }))
  }
  return formatters.get(code)!
}

function fmtDate(d?: Date | string | null, locale = 'es') {
  if (!d) return null
  try {
    return getFormatter(locale).format(new Date(d))
  } catch {
    return null
  }
}

export function ProfileMetaBlock({
  bio,
  location,
  website,
  createdAt,
  socials,
  locale = 'es',
  t,
}: Props) {
  const memberSince = fmtDate(createdAt, locale)
  const hasSocials = socials && Object.values(socials).some(Boolean)
  const hasMeta = !!(bio || location || website || memberSince || hasSocials)
  if (!hasMeta) return null

  return (
    <section className="mt-2 border border-t-0 border-[var(--color-outline-variant)] rounded-b-sm bg-[var(--color-surface-container-lowest)] -mt-px">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] divide-y lg:divide-y-0 lg:divide-x divide-[var(--color-outline-variant)]">
        {/* Bio */}
        <div className="p-4 sm:p-5">
          <Eyebrow>{t('profile.bio')}</Eyebrow>
          {bio ? (
            <p className="font-sans text-sm sm:text-base text-[var(--color-on-surface)] leading-relaxed whitespace-pre-line mt-1.5 border-l-2 border-[var(--color-primary)] pl-3">
              {bio}
            </p>
          ) : (
            <p className="font-sans text-sm text-[var(--color-on-surface-variant)] italic opacity-60 mt-1.5">
              {t('profile.noBio')}
            </p>
          )}
        </div>

        {/* Metadata compact */}
        <dl className="p-4 sm:p-5 grid grid-cols-2 lg:grid-cols-1 gap-x-6 gap-y-3 lg:min-w-[260px] content-start">
          {location && <MetaRow label={t('profile.location')} value={location} />}
          {website && (
            <MetaRow
              label={t('profile.website')}
              value={
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-primary)] underline-offset-4 hover:underline break-all"
                >
                  {website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </a>
              }
            />
          )}
          {memberSince && <MetaRow label={t('profile.memberSince')} value={memberSince} />}
          {hasSocials && (
            <div className="col-span-2 lg:col-span-1 flex flex-col gap-1.5">
              <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-on-surface-variant)] opacity-70">
                {t('profile.socials')}
              </dt>
              <dd>
                <SocialLinks socials={socials} />
              </dd>
            </div>
          )}
        </dl>
      </div>
    </section>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-on-surface-variant)] opacity-70 block">
      {children}
    </span>
  )
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-on-surface-variant)] opacity-70">
        {label}
      </dt>
      <dd className="font-sans text-sm text-[var(--color-primary)] truncate">{value}</dd>
    </div>
  )
}
