'use client'

import { useState } from 'react'
import { MotionConfig, motion } from 'motion/react'
import Navbar from './Navbar'
import Footer from '@frontend/shared/ui/Footer'
import { useChrome } from './ChromeProvider'
import { ReactNode } from 'react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { transition } from '@frontend/shared/motion/tokens'
import { useCanHover } from '@frontend/shared/hooks/useCanHover'

type ShellProps = {
  children: ReactNode
  /** Sin el padding del contenedor: las secciones llegan de borde a borde (Home). */
  fullBleed?: boolean
  /** Muestra el pie global bajo el contenido. */
  footer?: boolean
}

function AppShellInner({ children, fullBleed = false, footer = false }: ShellProps) {
  const { navbarOpen, toggleNavbar, edgeReveal, isBoards } = useChrome()
  const { t } = usePreferences()
  const canHover = useCanHover()
  const [focused, setFocused] = useState(false)
  // Mantiene la flecha revelada mientras el ratón está sobre ella (evita temblor).
  const [hovered, setHovered] = useState(false)
  // En boards el control se oculta y solo aparece por proximidad/foco/hover/táctil;
  // en el resto de páginas se muestra siempre (no hay zona de proximidad).
  // Con el navbar abierto, el toggle (cerrar) siempre se ve.
  const reopenRevealed = navbarOpen || !isBoards || edgeReveal.top || focused || hovered || !canHover

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-on-surface)] flex flex-col relative">
      {/* Header global (escritorio) + barra y menú móvil. La navegación principal
          vive en el header; el sidebar global ya no se renderiza. */}
      <Navbar />

      {/* Toggle ÚNICO del navbar (mostrar/ocultar) — siempre en el mismo lugar
          (arriba a la derecha, dentro de la barra): cierra cuando está abierto,
          abre cuando oculto. */}
      <motion.button
        type="button"
        onClick={toggleNavbar}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={navbarOpen ? t('common.hideTopBar') : t('common.showTopBar')}
        title={navbarOpen ? t('common.hideTopBar') : t('common.showTopBar')}
        aria-pressed={navbarOpen}
        className={`hidden md:flex print:hidden fixed top-0 right-6 xl:right-[var(--spacing-page-margin)] z-50 items-center justify-center w-10 text-[var(--color-on-surface)] hover:text-[var(--color-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
          navbarOpen
            ? 'h-[var(--spacing-appbar-height)]'
            : 'h-7 bg-[var(--color-surface)] border border-t-0 border-[var(--color-outline-variant)]'
        }`}
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: reopenRevealed ? 0 : -24, opacity: reopenRevealed ? 1 : 0 }}
        transition={transition.base}
        style={{ pointerEvents: reopenRevealed ? 'auto' : 'none' }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="material-symbols-outlined" aria-hidden>{navbarOpen ? 'expand_less' : 'expand_more'}</span>
      </motion.button>

      {/* Main Content Area */}
      <main
        className={`flex-1 ${navbarOpen ? 'md:pt-[var(--spacing-appbar-height)]' : 'md:pt-0'} flex flex-col min-w-0 bg-[var(--color-background)] transition-all duration-300 ease-in-out`}
      >
        <div className={`flex-1 relative ${fullBleed ? '' : 'p-[var(--spacing-container-padding)]'}`}>
          {children}
        </div>
        {footer && <Footer />}
      </main>
    </div>
  )
}

export default function AppShell({ children, fullBleed, footer }: ShellProps) {
  // ChromeProvider vive en la raíz (Providers) para persistir entre navegaciones.
  return (
    <MotionConfig reducedMotion="user">
      <AppShellInner fullBleed={fullBleed} footer={footer}>{children}</AppShellInner>
    </MotionConfig>
  )
}
