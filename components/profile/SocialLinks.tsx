import Link from 'next/link'

type Socials = {
  twitter?: string
  instagram?: string
  behance?: string
  artstation?: string
  tiktok?: string
}

const ORDER: Array<keyof Socials> = ['twitter', 'instagram', 'behance', 'artstation', 'tiktok']

const LABEL: Record<keyof Socials, string> = {
  twitter: 'Twitter',
  instagram: 'Instagram',
  behance: 'Behance',
  artstation: 'ArtStation',
  tiktok: 'TikTok',
}

export function SocialLinks({ socials }: { socials?: Socials | null }) {
  if (!socials) return null
  const items = ORDER.filter((k) => socials[k] && typeof socials[k] === 'string')
  if (items.length === 0) return null

  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((k) => (
        <li key={k}>
          <Link
            href={socials[k]!}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] uppercase tracking-widest border border-[var(--color-outline-variant)] px-3 py-1.5 rounded-sm text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
          >
            {LABEL[k]}
          </Link>
        </li>
      ))}
    </ul>
  )
}
