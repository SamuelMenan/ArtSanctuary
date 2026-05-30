'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { useChrome } from './ChromeProvider'
import { type Locale, type ThemeMode } from '@shared/i18n'

export default function Navbar() {
  const { data: session, status } = useSession()
  const { locale, theme, setLocale, setTheme, t } = usePreferences()
  const { sidebarOpen, toggleSidebar, navbarOpen, toggleNavbar } = useChrome()
  const [isOpen, setIsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const pathname = usePathname()
  const { push, refresh } = useRouter();
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

  // Cargar notificaciones periódicamente
  useEffect(() => {
    if (status !== 'authenticated') return;

    const buildApiUrl = (path: string) => {
      if (typeof window === 'undefined') return path
      return new URL(path, window.location.origin).toString()
    }
    
    const fetchNotifs = async () => {
      try {
        const res = await fetch(buildApiUrl('/api/notifications'), {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        })
        if (!res.ok) return

        const data = await res.json();
        if (data.notifications) {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
        }
      } catch (err) {
        console.error('[Navbar notifications fetch]', err);
      }
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000); // Polling cada 30s
    return () => clearInterval(interval);
  }, [status]);

  const markAllAsRead = async () => {
    try {
      const endpoint = typeof window === 'undefined'
        ? '/api/notifications/read-all'
        : new URL('/api/notifications/read-all', window.location.origin).toString()

      await fetch(endpoint, {
        method: 'PATCH',
        credentials: 'include',
      });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('[Navbar mark all read]', err);
    }
  };

  const handleNotifClick = async (n: any) => {
    if (!n.read) {
      try {
        const endpoint = typeof window === 'undefined'
          ? `/api/notifications/${n._id}/read`
          : new URL(`/api/notifications/${n._id}/read`, window.location.origin).toString()

        await fetch(endpoint, {
          method: 'PATCH',
          credentials: 'include',
        });
        setNotifications(prev => prev.map(notif => notif._id === n._id ? { ...notif, read: true } : notif));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('[Navbar read notification]', err);
      }
    }
    if (n.type === 'follow' && n.actorId?._id) {
      setIsNotifOpen(false);
      push(`/profile/${n.actorId._id}`);
    } else if (n.artworkId?._id) {
      setIsNotifOpen(false);
      push(`/explore?artworkId=${n.artworkId._id}`);
    }
  };

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
          
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] flex items-center justify-center p-2 rounded-full hover:bg-[var(--color-surface-container-low)] transition-all duration-200 focus:outline-none relative"
            >
              <span className="material-symbols-outlined">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 size-2 bg-[var(--color-primary)] rounded-full animate-pulse"></span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-[var(--color-surface-container-high)] border border-[var(--color-outline-variant)] rounded-sm shadow-xl flex flex-col z-50 overflow-hidden">
                <div className="p-4 border-b border-[var(--color-outline-variant)] flex justify-between items-center bg-[var(--color-surface-container)]">
                  <span className="font-sans font-semibold text-[var(--color-primary)] text-sm">{t('menu.notifications')}</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="font-mono text-[10px] text-[var(--color-on-surface-variant)] uppercase hover:text-[var(--color-primary)] transition-colors">
                      {t('menu.markAllRead')}
                    </button>
                  )}
                </div>
                
                <div className="max-h-96 overflow-y-auto custom-scrollbar flex flex-col">
                  {notifications.length > 0 ? notifications.map((n) => (
                    <div 
                      key={n._id} 
                      onClick={() => handleNotifClick(n)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleNotifClick(n);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className={`p-4 border-b border-[var(--color-outline-variant)] flex items-start gap-3 hover:bg-[var(--color-surface-container-low)] transition-colors cursor-pointer ${!n.read ? 'bg-[var(--color-surface-container-lowest)] border-l-2 border-l-[var(--color-primary)]' : 'opacity-70'}`}
                    >
                      <div className="shrink-0 mt-1">
                        <span className="material-symbols-outlined text-[var(--color-on-surface-variant)] text-lg">
                          {n.type === 'like' ? 'favorite' : n.type === 'comment' ? 'chat_bubble' : n.type === 'save' ? 'bookmark' : 'person_add'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-sans text-xs text-[var(--color-primary)]">
                          <strong className="font-semibold">{n.actorId?.displayName || n.actorId?.username || 'Usuario'}</strong> 
                          {n.type === 'like' ? ' le dio me gusta a tu obra ' : n.type === 'comment' ? ' comentó en tu obra ' : n.type === 'save' ? ' guardó tu obra en una colección ' : ' te empezó a seguir '}
                          {n.artworkId && <span className="italic">&quot;{n.artworkId?.title}&quot;</span>}
                        </p>
                        {n.message && (
                          <p className="font-sans text-[10px] text-[var(--color-on-surface-variant)] mt-1 truncate border-l border-[var(--color-outline-variant)] pl-2">{n.message}</p>
                        )}
                        <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-on-surface-variant)] mt-2 block">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )) : (
                    <div className="p-8 text-center text-[var(--color-on-surface-variant)] font-sans text-xs">
                      {t('menu.noNotifications')}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] flex items-center justify-center p-2 rounded-full hover:bg-[var(--color-surface-container-low)] transition-all duration-200 focus:outline-none"
            >
              <span className="material-symbols-outlined">account_circle</span>
            </button>
            
            {/* Profile Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[var(--color-surface-container-high)] border border-[var(--color-outline-variant)] rounded-md shadow-lg overflow-hidden flex flex-col z-50">
                <div className="border-b border-[var(--color-outline-variant)] p-3 bg-[var(--color-surface-container)]">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-on-surface-variant)]">{t('menu.preferences')}</p>
                  <div className="mt-3 space-y-3">
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-on-surface-variant)] mb-2">{t('menu.theme')}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {(['dark', 'light'] as ThemeMode[]).map((option) => (
                          <button
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
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-[var(--text-label-sm)] font-mono text-[var(--color-on-surface)] hover:bg-[var(--color-surface-variant)] hover:text-[var(--color-primary)] transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">person</span>
                      {t('nav.profile')}
                    </Link>
                    <Link 
                      href="/settings" 
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-[var(--text-label-sm)] font-mono text-[var(--color-on-surface)] hover:bg-[var(--color-surface-variant)] hover:text-[var(--color-primary)] transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">settings</span>
                      {t('nav.settings')}
                    </Link>
                    <div className="h-[1px] bg-[var(--color-outline-variant)] w-full"></div>
                    <button 
                      onClick={() => {
                        setIsProfileOpen(false)
                        signOut({ callbackUrl: '/login' })
                      }}
                      className="flex items-center gap-3 px-4 py-3 text-[var(--text-label-sm)] font-mono text-[var(--color-error)] hover:bg-[var(--color-surface-variant)] transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      {t('nav.logout')}
                    </button>
                  </>
                ) : (
                  <>
                    <Link 
                      href="/login" 
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-[var(--text-label-sm)] font-mono text-[var(--color-on-surface)] hover:bg-[var(--color-surface-variant)] hover:text-[var(--color-primary)] transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">login</span>
                      {t('nav.login')}
                    </Link>
                    <Link 
                      href="/register" 
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-[var(--text-label-sm)] font-mono text-[var(--color-on-surface)] hover:bg-[var(--color-surface-variant)] hover:text-[var(--color-primary)] transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">person_add</span>
                      {t('nav.register')}
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile TopAppBar */}
      <nav className="md:hidden flex items-center justify-between px-6 py-4 bg-[var(--color-surface-container)] border-b border-[var(--color-outline-variant)] sticky top-0 z-50">
        <div>
          <h1 className="text-xl font-display-lg tracking-[-0.02em] text-[var(--color-primary)] font-bold">
            ArtSanctuary
          </h1>
        </div>
        <button 
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
            ].map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-4 py-3 font-mono text-[var(--text-label-sm)] uppercase tracking-[0.05em] pl-4 hover:text-[var(--color-primary)] transition-colors duration-200 `}
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
                    className="flex items-center gap-4 py-3 font-mono text-[var(--text-label-sm)] uppercase tracking-[0.05em] pl-4 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">person</span>
                    <span>{t('nav.profile')}</span>
                  </Link>
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      signOut({ callbackUrl: '/login' })
                    }}
                    className="flex items-center gap-4 py-3 font-mono text-[var(--text-label-sm)] uppercase tracking-[0.05em] pl-4 text-[var(--color-error)] hover:text-[var(--color-error-container)] transition-colors w-full text-left"
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
                    className="flex items-center gap-4 py-3 font-mono text-[var(--text-label-sm)] uppercase tracking-[0.05em] pl-4 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">login</span>
                    <span>{t('nav.login')}</span>
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-4 py-3 font-mono text-[var(--text-label-sm)] uppercase tracking-[0.05em] pl-4 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors"
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
