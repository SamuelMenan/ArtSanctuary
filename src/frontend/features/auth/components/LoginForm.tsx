'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { AnimatePresence, motion } from 'motion/react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { fadeSlide, shake, transition } from '@frontend/shared/motion/tokens'
import FormField from './FormField'
import PasswordField from './PasswordField'
import { validateEmail, validateLoginPassword } from './validation'

interface LoginFormProps {
  /** Cambia a la pantalla de registro (transición animada en AuthFlow). */
  onSwitchMode: () => void
}

export default function LoginForm({ onSwitchMode }: LoginFormProps) {
  const { t } = usePreferences()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({})
  const [attempted, setAttempted] = useState(false)
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { push, refresh } = useRouter()

  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  const emailErrorKey = validateEmail(email)
  const passwordErrorKey = validateLoginPassword(password)

  const showEmailError = (touched.email || attempted) && emailErrorKey
  const showPasswordError = (touched.password || attempted) && passwordErrorKey

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setFormError('')
    setAttempted(true)

    if (emailErrorKey) {
      emailRef.current?.focus()
      return
    }
    if (passwordErrorKey) {
      passwordRef.current?.focus()
      return
    }

    setLoading(true)
    try {
      const res = await signIn('credentials', { email, password, redirect: false })

      if (res?.error) {
        setFormError(t('auth.incorrectCredentials'))
        passwordRef.current?.focus()
      } else {
        setSuccess(true)
        push('/')
        refresh()
      }
    } catch {
      setFormError(t('auth.networkError'))
    } finally {
      setLoading(false)
    }
  }

  const disabled = loading || success

  return (
    <div>
      <div className="bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] rounded-[var(--radius-xl)] p-6 sm:p-8 shadow-sm">
        <h2 className="font-sans text-headline-md text-[var(--color-primary)] mb-8 text-center uppercase tracking-wide font-semibold">
          {t('auth.loginTitle')}
        </h2>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <AnimatePresence>
            {formError && (
              <motion.div
                role="alert"
                variants={fadeSlide}
                initial="initial"
                animate={{ ...shake, opacity: 1, y: 0 }}
                exit="exit"
                className="p-3 bg-[var(--color-error-container)] text-[var(--color-on-error-container)] rounded-[var(--radius-sm)] text-sm font-sans border border-[var(--color-error)]"
              >
                {formError}
              </motion.div>
            )}
          </AnimatePresence>

          <FormField
            ref={emailRef}
            id="email-input"
            label={t('auth.email')}
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((s) => ({ ...s, email: true }))}
            error={showEmailError ? t(emailErrorKey) : undefined}
            valid={Boolean((touched.email || attempted) && !emailErrorKey && email)}
            validLabel={t('auth.fieldValid')}
            help={t('auth.helpEmail')}
            placeholder="correo@ejemplo.com"
            autoComplete="email"
            required
            disabled={disabled}
          />

          <div>
            <PasswordField
              ref={passwordRef}
              id="password-input"
              label={t('auth.password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((s) => ({ ...s, password: true }))}
              error={showPasswordError ? t(passwordErrorKey) : undefined}
              valid={Boolean((touched.password || attempted) && !passwordErrorKey && password)}
              validLabel={t('auth.fieldValid')}
              showLabel={t('auth.showPassword')}
              hideLabel={t('auth.hidePassword')}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              disabled={disabled}
            />
            <div className="flex justify-end mt-2">
              <a href="#" className="font-sans text-xs text-[var(--color-outline)] hover:text-[var(--color-primary)] transition-colors">
                {t('auth.forgotPassword')}
              </a>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={disabled}
            whileHover={disabled ? undefined : { scale: 1.01 }}
            whileTap={disabled ? undefined : { scale: 0.99 }}
            transition={transition.fast}
            className={`w-full bg-[var(--color-primary)] text-[var(--color-on-primary)] border border-[var(--color-outline)] shadow-[0_1px_0_var(--color-outline)] font-mono text-xs uppercase tracking-widest py-4 rounded-[var(--radius-sm)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-outline)] mt-4 ${disabled ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[var(--color-primary-container)]'}`}
          >
            {success ? `✓ ${t('auth.loginSuccess')}` : loading ? t('auth.signingIn') : t('auth.enter')}
          </motion.button>
        </form>
      </div>

      <div className="text-center mt-8">
        <p className="font-sans text-sm text-[var(--color-on-surface-variant)]">
          {t('auth.noAccount')}{' '}
          <button
            type="button"
            onClick={onSwitchMode}
            className="text-[var(--color-primary)] hover:underline border-b border-[var(--color-primary)] pb-0.5"
          >
            {t('auth.signUpLink')}
          </button>
        </p>
      </div>
    </div>
  )
}
