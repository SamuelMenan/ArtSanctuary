'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import AuthAside, { AuthMobileHeader } from '@frontend/features/auth/components/AuthAside'
import LoginForm from '@frontend/features/auth/components/LoginForm'
import RegisterForm from '@frontend/features/auth/components/RegisterForm'
import { cardSwap } from '@frontend/shared/motion/tokens'

type Mode = 'login' | 'register'

interface AuthFlowProps {
  initialMode: Mode
}

/**
 * Contenedor unificado de Login/Registro. El panel lateral queda fijo y solo la
 * tarjeta del formulario hace transición (elemento compartido) al cambiar de modo,
 * sin recargar la página. Sincroniza la URL con history.replaceState para no
 * remontar (eso mataría la animación) y respeta back/forward del navegador.
 */
export default function AuthFlow({ initialMode }: AuthFlowProps) {
  const { t } = usePreferences()
  const [mode, setMode] = useState<Mode>(initialMode)
  // Dirección de la transición: 1 = avanza a registro, -1 = vuelve a login.
  const [direction, setDirection] = useState<1 | -1>(1)

  const applyMode = useCallback(
    (next: Mode, updateHistory: boolean) => {
      setDirection(next === 'register' ? 1 : -1)
      setMode(next)
      if (updateHistory) {
        const path = next === 'register' ? '/register' : '/login'
        window.history.replaceState(window.history.state, '', path)
      }
      const title = next === 'register' ? t('auth.createAccount') : t('auth.loginTitle')
      document.title = `${title} | ArtSanctuary`
    },
    [t],
  )

  const switchMode = useCallback(
    (next: Mode) => applyMode(next, true),
    [applyMode],
  )

  // Mantener el modo en sync con back/forward del navegador.
  useEffect(() => {
    const onPop = () => {
      const next: Mode = window.location.pathname.startsWith('/register') ? 'register' : 'login'
      applyMode(next, false)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [applyMode])

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex flex-col md:flex-row w-full min-h-screen bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] antialiased">
        <AuthAside t={t} />

        <div className="w-full md:w-1/2 flex justify-center items-center p-6 sm:p-[var(--spacing-container-padding)] bg-[var(--color-surface-container-lowest)]">
          <div className="w-full max-w-[400px]">
            <AuthMobileHeader t={t} />

            <motion.div layout>
              <AnimatePresence mode="wait" custom={direction} initial={false}>
                <motion.div
                  key={mode}
                  custom={direction}
                  variants={cardSwap(direction)}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {mode === 'login' ? (
                    <LoginForm onSwitchMode={() => switchMode('register')} />
                  ) : (
                    <RegisterForm onSwitchMode={() => switchMode('login')} />
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </MotionConfig>
  )
}
