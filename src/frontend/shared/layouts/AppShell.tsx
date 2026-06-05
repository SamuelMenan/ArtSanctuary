'use client'

import { useState } from 'react'
import { MotionConfig, motion } from 'motion/react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import ChromeProvider, { useChrome } from './ChromeProvider'
import { ReactNode } from 'react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { transition } from '@frontend/shared/motion/tokens'
import { useCanHover } from '@frontend/shared/hooks/useCanHover'

function AppShellInner({ children }: { children: ReactNode }) {
  const { sidebarOpen, navbarOpen, setNavbarOpen, edgeReveal, isBoards } = useChrome()
  const { t } = usePreferences()
  const canHover = useCanHover()
  const [focused, setFocused] = useState(false)
  // Mantiene la flecha revelada mientras el ratón está sobre ella (evita temblor).
  const [hovered, setHovered] = useState(false)
  // En boards el control se oculta y solo aparece por proximidad/foco/hover/táctil;
  // en el resto de páginas se muestra siempre (no hay zona de proximidad).
  const reopenRevealed = !isBoards || edgeReveal.top || focused || hovered || !canHover

  return (
    <div className="min-h-screen bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] flex flex-col md:flex-row relative">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Navbar */}
      <Navbar />

      {/* Botón flotante para volver a mostrar el navbar cuando está oculto */}
      {!navbarOpen && (
        <motion.button
          type="button"
          onClick={() => setNavbarOpen(true)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          aria-label={t('common.showTopBar')}
          title={t('common.showTopBar')}
          className="hidden md:flex fixed top-0 left-1/2 z-50 items-center justify-center w-12 h-6 rounded-b-md bg-[var(--color-surface-container)] border border-t-0 border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] shadow-md"
          initial={{ x: '-50%', y: -24, opacity: 0 }}
          animate={{ x: '-50%', y: reopenRevealed ? 0 : -24, opacity: reopenRevealed ? 1 : 0 }}
          transition={transition.base}
          style={{ pointerEvents: reopenRevealed ? 'auto' : 'none' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden>expand_more</span>
        </motion.button>
      )}

      {/* Main Content Area */}
      <main
        className={`flex-1 ${navbarOpen ? 'md:pt-[var(--spacing-appbar-height)]' : 'md:pt-0'} flex flex-col min-w-0 bg-[var(--color-background)] transition-all duration-300 ease-in-out ${
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
      <MotionConfig reducedMotion="user">
        <AppShellInner>{children}</AppShellInner>
      </MotionConfig>
    </ChromeProvider>
  )
}
