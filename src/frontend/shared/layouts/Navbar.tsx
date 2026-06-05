'use client'

import { useState, useRef, useEffect } from 'react'
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
import { appBarShell, appBarBg, appBarTitle } from './appbar/appBarStyles'

export default function Navbar() {
  const { status } = useSession()
  const { locale, theme, setLocale, setTheme, t } = usePreferences()
  const { sidebarOpen, toggleSidebar, navbarOpen, toggleNavbar } = useChrome()
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
        className={`hidden md:flex ${appBarShell} ${appBarBg.glass} fixed top-0 right-0 justify-between z-40 transition-[left] duration-300 ease-in-out ${sidebarOpen ? 'md:left-[var(--spacing-sidebar-width)]' : 'md:left-0'}`}
        animate={{ y: navbarOpen ? 0 : '-100%' }}
        transition={transition.base}
      >
        <div className="flex items-center gap-1">
          <AppBarButton
            icon={sidebarOpen ? 'chevron_left' : 'chevron_right'}
            label={sidebarOpen ? t('common.hideSidebar') : t('common.showSidebar')}
            onClick={toggleSidebar}
          />
          <div className={`${appBarTitle} px-1`}>ArtSanctuary</div>
          <AppBarButton icon="expand_less" label={t('common.hideTopBar')} onClick={toggleNavbar} />
        </div>
        <div className="flex items-center gap-1">
          <AppBarButton icon="search" label={t('common.search')} href="/explore" />

          <NotificationsMenu
            isOpen={isNotifOpen}
            setIsOpen={setIsNotifOpen}
            notifRef={notifRef}
            t={t}
          />

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
