'use client'

import Link from 'next/link'
import BrandLogos from './BrandLogos'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'

const indexLinks = [
  { key: 'nav.home', href: '/' },
  { key: 'nav.gallery', href: '/gallery' },
  { key: 'nav.explore', href: '/explore' },
  { key: 'nav.tools', href: '/dashboard/tools' },
  { key: 'nav.workspaces', href: '/dashboard/workspaces' },
]

const accountLinks = [
  { key: 'nav.login', href: '/login' },
  { key: 'nav.register', href: '/register' },
]

function FooterNav({ title, links, className }: { title: string; links: typeof indexLinks; className: string }) {
  const { t } = usePreferences()
  return (
    <nav aria-label={title} className={`px-8 pt-10 pb-8 border-b border-[var(--color-outline)] ${className}`}>
      <p className="font-sans font-bold text-[13px] leading-[19.5px] tracking-[0.5px] uppercase text-[var(--color-on-surface-variant)] mb-1.5">
        {title}
      </p>
      <ul>
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="group flex items-center justify-between gap-4 py-1.5 font-sans font-bold text-[26px] leading-[32.5px] uppercase text-[var(--color-on-surface)] hover:text-[var(--color-primary)] transition-colors"
            >
              <span>{t(link.key)}</span>
              <span className="material-symbols-outlined transition-transform group-hover:translate-x-1" aria-hidden>
                arrow_forward
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** Pie global: marca + descripción, columna INDEX, columna ACCOUNT y copyright. */
export default function Footer() {
  const { t } = usePreferences()
  return (
    <footer className="print:hidden bg-[var(--color-surface)] border border-[var(--color-outline)]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12">
        <div className="md:col-span-2 lg:col-span-3 px-8 pt-10 pb-8 border-b border-[var(--color-outline)]">
          <BrandLogos variant="footer" />
          <p className="mt-[18px] max-w-[308px] font-sans text-base leading-6 text-[var(--color-on-surface)]">
            {t('footer.tagline')}
          </p>
        </div>
        <FooterNav title={t('footer.index')} links={indexLinks} className="lg:col-span-5" />
        <FooterNav title={t('footer.account')} links={accountLinks} className="lg:col-span-4" />
      </div>
      <p className="px-8 py-2 font-sans font-semibold text-[13px] leading-5 text-[var(--color-on-surface)]">
        {t('footer.rights')}
      </p>
    </footer>
  )
}
