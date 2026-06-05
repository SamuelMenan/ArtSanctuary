'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { type Locale, type ThemeMode } from '@shared/i18n'
import { appBarIconBtnIdle } from '../appbar/appBarStyles'

interface ProfileMenuProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  dropdownRef: React.RefObject<HTMLDivElement | null>
  status: string
  theme: ThemeMode
  locale: Locale
  setSelectedTheme: (theme: ThemeMode) => void
  setSelectedLocale: (locale: Locale) => void
  t: (key: string) => string
}

export default function ProfileMenu({
  isOpen,
  setIsOpen,
  dropdownRef,
  status,
  theme,
  locale,
  setSelectedTheme,
  setSelectedLocale,
  t,
}: ProfileMenuProps) {
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('nav.profile')}
        aria-expanded={isOpen}
        className={appBarIconBtnIdle}
      >
        <span className="material-symbols-outlined text-[20px]" aria-hidden>account_circle</span>
      </button>

      {/* Profile Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[var(--color-surface-container-high)] border border-[var(--color-outline-variant)] rounded-md shadow-lg overflow-hidden flex flex-col z-50">
          <div className="border-b border-[var(--color-outline-variant)] p-3 bg-[var(--color-surface-container)]">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-on-surface-variant)]">{t('menu.preferences')}</p>
            <div className="mt-3 space-y-3">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-on-surface-variant)] mb-2">{t('menu.theme')}</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['dark', 'light'] as ThemeMode[]).map((option) => (
                    <button
                      type="button"
                      key={option}
                      onClick={() => setSelectedTheme(option)}
                      className={`rounded-sm border px-2 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors ${theme === option ? 'border-[var(--color-primary)] bg-[var(--color-surface-container-highest)] text-[var(--color-primary)]' : 'border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'}`}
                    >
                      {option === 'dark' ? t('menu.dark') : t('menu.light')}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-on-surface-variant)] mb-2">{t('menu.language')}</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['es', 'en'] as Locale[]).map((option) => (
                    <button
                      type="button"
                      key={option}
                      onClick={() => setSelectedLocale(option)}
                      className={`rounded-sm border px-2 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors ${locale === option ? 'border-[var(--color-primary)] bg-[var(--color-surface-container-highest)] text-[var(--color-primary)]' : 'border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'}`}
                    >
                      {option === 'es' ? t('menu.spanish') : t('menu.english')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {status === 'authenticated' ? (
            <>
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-label-sm font-mono text-[var(--color-on-surface)] hover:bg-[var(--color-surface-variant)] hover:text-[var(--color-primary)] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">person</span>
                {t('nav.profile')}
              </Link>
              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-label-sm font-mono text-[var(--color-on-surface)] hover:bg-[var(--color-surface-variant)] hover:text-[var(--color-primary)] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">settings</span>
                {t('nav.settings')}
              </Link>
              <div className="h-[1px] bg-[var(--color-outline-variant)] w-full"></div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  signOut({ callbackUrl: '/login' })
                }}
                className="flex items-center gap-3 px-4 py-3 text-label-sm font-mono text-[var(--color-error)] hover:bg-[var(--color-surface-variant)] transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-label-sm font-mono text-[var(--color-on-surface)] hover:bg-[var(--color-surface-variant)] hover:text-[var(--color-primary)] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                {t('nav.login')}
              </Link>
              <Link
                href="/register"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-label-sm font-mono text-[var(--color-on-surface)] hover:bg-[var(--color-surface-variant)] hover:text-[var(--color-primary)] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                {t('nav.register')}
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  )
}
