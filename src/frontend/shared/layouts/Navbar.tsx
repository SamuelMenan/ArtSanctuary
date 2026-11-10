'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { useChrome } from './ChromeProvider'
import { transition } from '@frontend/shared/motion/tokens'
import { type Locale, type ThemeMode } from '@shared/i18n'
import NotificationsMenu from './navbar/NotificationsMenu'
import ProfileMenu from './navbar/ProfileMenu'
import MobileMenu from './navbar/MobileMenu'
import AppBarButton from './appbar/AppBarButton'
import BrandLogos from '@frontend/shared/ui/BrandLogos'
import UploadButton from '@frontend/shared/ui/UploadButton'

// Navegación principal del header (antes vivía en el sidebar).
const navItems = [
  { key: 'nav.home', href: '/' },
  { key: 'nav.gallery', href: '/gallery' },
  { key: 'nav.explore', href: '/explore' },
  { key: 'nav.tools', href: '/dashboard/tools' },
  { key: 'nav.workspaces', href: '/dashboard/workspaces' },
]

const divider = 'h-8 w-px shrink-0 bg-[var(--color-outline-variant)]'

export default function Navbar() {
  const { status } = useSession()
  const { locale, theme, setLocale, setTheme, t } = usePreferences()
  const { navbarOpen } = useChrome()
  const [isOpen, setIsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)

  const pathname = usePathname()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  // Cerrar el dropdown si se hace click fuera de él
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const setSelectedTheme = (nextTheme: ThemeMode) => {
    setTheme(nextTheme)
  }

  const setSelectedLocale = (nextLocale: Locale) => {
    setLocale(nextLocale)
    setIsProfileOpen(false)
  }

  return (
    <>
      {/* Desktop TopAppBar — se esconde/muestra con su propio toggle */}
      <motion.header
        className="hidden md:flex print:hidden fixed top-0 left-0 right-0 z-40 h-[var(--spacing-appbar-height)] items-center justify-between gap-4 bg-[var(--color-surface)] border-b border-[var(--color-outline-variant)] pl-6 xl:pl-[var(--spacing-page-margin)] pr-[72px] xl:pr-[112px]"
        animate={{ y: navbarOpen ? 0 : '-100%' }}
        transition={transition.base}
      >
        <Link href="/" aria-label={t('nav.home')} className="flex items-center shrink-0">
          <BrandLogos variant="header" />
        </Link>
        <div className="flex items-center gap-2 xl:gap-3 min-w-0">
          <nav className="flex items-center gap-5 xl:gap-9 mr-1 xl:mr-3 font-sans text-[15px] leading-[22.5px] text-[var(--color-on-surface)]">
            {navItems.map((item) => {
              const isActive = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`whitespace-nowrap transition-colors hover:text-[var(--color-primary)] ${isActive ? 'font-semibold' : 'font-medium'}`}
                >
                  {t(item.key)}
                </Link>
              )
            })}
          </nav>
          <span className={divider} aria-hidden />
          <AppBarButton icon="search" label={t('common.search')} href="/explore" />

          <NotificationsMenu
            isOpen={isNotifOpen}
            setIsOpen={setIsNotifOpen}
            notifRef={notifRef}
            t={t}
          />

          <span className={divider} aria-hidden />
          <UploadButton compact />

          <ProfileMenu
            isOpen={isProfileOpen}
            setIsOpen={setIsProfileOpen}
            dropdownRef={dropdownRef}
            status={status}
            theme={theme}
            locale={locale}
            setSelectedTheme={setSelectedTheme}
            setSelectedLocale={setSelectedLocale}
            t={t}
          />
        </div>
      </motion.header>

      <MobileMenu
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        pathname={pathname}
        status={status}
        theme={theme}
        locale={locale}
        setSelectedTheme={setSelectedTheme}
        setSelectedLocale={setSelectedLocale}
        t={t}
      />
    </>
  )
}
