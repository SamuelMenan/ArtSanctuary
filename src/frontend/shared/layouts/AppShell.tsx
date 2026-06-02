'use client'

import Sidebar from './Sidebar'
import Navbar from './Navbar'
import ChromeProvider, { useChrome } from './ChromeProvider'
import { ReactNode } from 'react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'

function AppShellInner({ children }: { children: ReactNode }) {
  const { sidebarOpen, navbarOpen, setNavbarOpen } = useChrome()
  const { t } = usePreferences()
  return (
    <div className="min-h-screen bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] flex flex-col md:flex-row relative">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Navbar */}
      <Navbar />

      {/* Botón flotante para volver a mostrar el navbar cuando está oculto */}
      {!navbarOpen && (
        <button
          onClick={() => setNavbarOpen(true)}
          aria-label={t('common.showTopBar')}
          title={t('common.showTopBar')}
          className="hidden md:flex fixed top-0 left-1/2 -translate-x-1/2 z-50 items-center justify-center w-12 h-6 rounded-b-md bg-[var(--color-surface-container)] border border-t-0 border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] shadow-md transition-all duration-200 animate-in fade-in slide-in-from-top-2"
        >
          <span className="material-symbols-outlined text-[20px]">expand_more</span>
        </button>
      )}

      {/* Main Content Area */}
      <main
        className={`flex-1 ${navbarOpen ? 'md:pt-16' : 'md:pt-0'} flex flex-col min-w-0 bg-[var(--color-background)] transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'md:ml-[var(--spacing-sidebar-width)]' : 'md:ml-0'
        }`}
      >
        <div className="flex-1 p-[var(--spacing-container-padding)] relative">
          {children}
        </div>
      </main>
    </div>
  )
}

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <ChromeProvider>
      <AppShellInner>{children}</AppShellInner>
    </ChromeProvider>
  )
}
