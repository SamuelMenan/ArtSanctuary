'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { type Locale, type ThemeMode } from '@shared/i18n'

interface MobileMenuProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  pathname: string | null
  status: string
  theme: ThemeMode
  locale: Locale
  setSelectedTheme: (theme: ThemeMode) => void
  setSelectedLocale: (locale: Locale) => void
  t: (key: string) => string
}

export default function MobileMenu({
  isOpen,
  setIsOpen,
  pathname,
  status,
  theme,
  locale,
  setSelectedTheme,
  setSelectedLocale,
  t,
}: MobileMenuProps) {
  return (
    <>
      {/* Mobile TopAppBar */}
      <nav className="md:hidden flex items-center justify-between px-6 py-4 bg-[var(--color-surface-container)] border-b border-[var(--color-outline-variant)] sticky top-0 z-50">
        <div>
          <h1 className="text-xl font-display-lg tracking-[-0.02em] text-[var(--color-primary)] font-bold">
            ArtSanctuary
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-[var(--color-primary)] p-2 focus:outline-none"
        >
          <span className="material-symbols-outlined">{isOpen ? 'close' : 'menu'}</span>
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 top-[73px] bg-[var(--color-surface-container)] z-40 overflow-y-auto flex flex-col">
          <ul className="flex flex-col gap-2 p-6 flex-grow">
            {[
              { label: t('nav.home'), href: '/', icon: 'home' },
              { label: t('nav.gallery'), href: '/gallery', icon: 'grid_view' },
              { label: t('nav.explore'), href: '/explore', icon: 'explore' },
              { label: t('nav.tools'), href: '/dashboard/tools', icon: 'handyman' },
              { label: t('nav.workspaces'), href: '/dashboard/workspaces', icon: 'folder_special' },
            ].map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-4 py-3 font-mono text-label-sm uppercase tracking-[0.05em] pl-4 hover:text-[var(--color-primary)] transition-colors duration-200 `}
                  >
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}

            <li className="mt-8 border-t border-[var(--color-outline-variant)] pt-6 flex flex-col gap-2">
              {status === 'authenticated' ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-4 py-3 font-mono text-label-sm uppercase tracking-[0.05em] pl-4 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">person</span>
                    <span>{t('nav.profile')}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false)
                      signOut({ callbackUrl: '/login' })
                    }}
                    className="flex items-center gap-4 py-3 font-mono text-label-sm uppercase tracking-[0.05em] pl-4 text-[var(--color-error)] hover:text-[var(--color-error-container)] transition-colors w-full text-left"
                  >
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                    <span>{t('nav.logout')}</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-4 py-3 font-mono text-label-sm uppercase tracking-[0.05em] pl-4 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">login</span>
                    <span>{t('nav.login')}</span>
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-4 py-3 font-mono text-label-sm uppercase tracking-[0.05em] pl-4 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">person_add</span>
                    <span>{t('nav.register')}</span>
                  </Link>
                </>
              )}
            </li>

            <li className="border-t border-[var(--color-outline-variant)] pt-6 mt-2">
              <div className="flex flex-col gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-on-surface-variant)] mb-2">{t('menu.theme')}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['dark', 'light'] as ThemeMode[]).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setSelectedTheme(option)}
                        className={`rounded-sm border px-3 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors ${theme === option ? 'border-[var(--color-primary)] bg-[var(--color-surface-container-high)] text-[var(--color-primary)]' : 'border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)]'}`}
                      >
                        {option === 'dark' ? t('menu.dark') : t('menu.light')}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-on-surface-variant)] mb-2">{t('menu.language')}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['es', 'en'] as Locale[]).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setSelectedLocale(option)}
                        className={`rounded-sm border px-3 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors ${locale === option ? 'border-[var(--color-primary)] bg-[var(--color-surface-container-high)] text-[var(--color-primary)]' : 'border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)]'}`}
                      >
                        {option === 'es' ? t('menu.spanish') : t('menu.english')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>
      )}
    </>
  )
}
