'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { useChrome } from './ChromeProvider'
import { type Locale, type ThemeMode } from '@shared/i18n'
import NotificationsMenu from './navbar/NotificationsMenu'
import ProfileMenu from './navbar/ProfileMenu'
import MobileMenu from './navbar/MobileMenu'

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
      <header className={`hidden md:flex bg-[var(--color-surface)]/60 backdrop-blur-md text-[var(--color-primary)] fixed top-0 right-0 h-16 border-b border-[var(--color-outline-variant)] justify-between items-center px-[var(--spacing-grid-gutter)] z-40 transition-all duration-300 ease-in-out ${sidebarOpen ? 'md:left-[var(--spacing-sidebar-width)]' : 'md:left-0'} ${navbarOpen ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? 'Ocultar menú lateral' : 'Mostrar menú lateral'}
            className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] flex items-center justify-center p-2 rounded-full hover:bg-[var(--color-surface-container-low)] transition-all duration-200"
          >
            <span className="material-symbols-outlined transition-transform duration-300" style={{ transform: sidebarOpen ? 'none' : 'rotate(180deg)' }}>
              chevron_left
            </span>
          </button>
          <div className="font-display font-bold text-xl text-[var(--color-primary)]">ArtSanctuary</div>
          <button
            type="button"
            onClick={toggleNavbar}
            aria-label="Ocultar barra superior"
            title="Ocultar barra superior"
            className="ml-1 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] flex items-center justify-center p-2 rounded-full hover:bg-[var(--color-surface-container-low)] transition-all duration-200"
          >
            <span className="material-symbols-outlined">expand_less</span>
          </button>
        </div>
        <div className="flex items-center gap-[var(--spacing-stack-md)]">
          <Link href="/explore" className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] flex items-center justify-center p-2 rounded-full hover:bg-[var(--color-surface-container-low)] transition-all duration-200">
            <span className="material-symbols-outlined">search</span>
          </Link>

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
      </header>

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
