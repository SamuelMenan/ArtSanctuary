'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { AnimatePresence, motion } from 'motion/react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { translateFields } from '@shared/i18n'
import { fadeSlide, shake, transition } from '@frontend/shared/motion/tokens'
import FormField from './FormField'
import PasswordField from './PasswordField'
import PasswordStrength from './PasswordStrength'
import { validateConfirm, validateEmail, validatePassword, validateUsername } from './validation'

type FieldErrors = { username?: string; email?: string }

interface RegisterFormProps {
  /** Cambia a la pantalla de inicio de sesión (transición animada en AuthFlow). */
  onSwitchMode: () => void
}

export default function RegisterForm({ onSwitchMode }: RegisterFormProps) {
  const { t } = usePreferences()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [attempted, setAttempted] = useState(false)
  const [apiErrors, setApiErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { push, refresh } = useRouter()

  const usernameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef<HTMLInputElement>(null)

  const usernameErrorKey = validateUsername(username)
  const emailErrorKey = validateEmail(email)
  const passwordErrorKey = validatePassword(password)
  const confirmErrorKey = validateConfirm(password, confirmPassword)

  const reveal = (field: string) => touched[field] || attempted

  const usernameError =
    (reveal('username') && usernameErrorKey && t(usernameErrorKey)) || apiErrors.username
  const emailError = (reveal('email') && emailErrorKey && t(emailErrorKey)) || apiErrors.email
  const passwordError = reveal('password') && passwordErrorKey ? t(passwordErrorKey) : undefined
  const confirmError = reveal('confirm') && confirmErrorKey ? t(confirmErrorKey) : undefined

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setFormError('')
    setAttempted(true)

    if (usernameErrorKey) return usernameRef.current?.focus()
    if (emailErrorKey) return emailRef.current?.focus()
    if (passwordErrorKey) return passwordRef.current?.focus()
    if (confirmErrorKey) return confirmRef.current?.focus()

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        const fields = translateFields(data?.error?.fields, t) as FieldErrors
        if (fields.email || fields.username) {
          setApiErrors(fields)
          if (fields.email) emailRef.current?.focus()
          else usernameRef.current?.focus()
        } else {
          setFormError(data?.error?.message || t('auth.registerError'))
        }
        return
      }

      const signInResult = await signIn('credentials', { email, password, redirect: false })
      if (signInResult?.error) {
        setFormError(t('auth.accountCreatedFallback'))
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
          {t('auth.createAccount')}
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
            ref={usernameRef}
            id="name-input"
            label={t('auth.artistName')}
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              if (apiErrors.username) setApiErrors((s) => ({ ...s, username: undefined }))
            }}
            onBlur={() => setTouched((s) => ({ ...s, username: true }))}
            error={usernameError || undefined}
            valid={Boolean(reveal('username') && !usernameErrorKey && !apiErrors.username && username)}
            validLabel={t('auth.fieldValid')}
            help={t('auth.helpUsername')}
            placeholder={t('auth.artistNameHint')}
            autoComplete="name"
            required
            disabled={disabled}
          />

          <FormField
            ref={emailRef}
            id="email-input"
            label={t('auth.email')}
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (apiErrors.email) setApiErrors((s) => ({ ...s, email: undefined }))
            }}
            onBlur={() => setTouched((s) => ({ ...s, email: true }))}
            error={emailError || undefined}
            valid={Boolean(reveal('email') && !emailErrorKey && !apiErrors.email && email)}
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
              error={passwordError}
              valid={Boolean(reveal('password') && !passwordErrorKey && password)}
              validLabel={t('auth.fieldValid')}
              showLabel={t('auth.showPassword')}
              hideLabel={t('auth.hidePassword')}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              disabled={disabled}
            />
            <PasswordStrength value={password} t={t} />
          </div>

          <PasswordField
            ref={confirmRef}
            id="password-confirm-input"
            label={t('auth.confirmPassword')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={() => setTouched((s) => ({ ...s, confirm: true }))}
            error={confirmError}
            valid={Boolean(reveal('confirm') && !confirmErrorKey && confirmPassword)}
            validLabel={t('auth.fieldValid')}
            showLabel={t('auth.showPassword')}
            hideLabel={t('auth.hidePassword')}
            placeholder="••••••••"
            autoComplete="new-password"
            required
            disabled={disabled}
          />

          <motion.button
            type="submit"
            disabled={disabled}
            whileHover={disabled ? undefined : { scale: 1.01 }}
            whileTap={disabled ? undefined : { scale: 0.99 }}
            transition={transition.fast}
            className={`w-full bg-[var(--color-primary)] text-[var(--color-on-primary)] border border-[var(--color-outline)] shadow-[0_1px_0_var(--color-outline)] font-mono text-xs uppercase tracking-widest py-4 rounded-[var(--radius-sm)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-outline)] mt-4 ${disabled ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[var(--color-primary-container)]'}`}
          >
            {success ? `✓ ${t('auth.registerSuccess')}` : loading ? t('auth.creating') : t('auth.createAccount')}
          </motion.button>
        </form>
      </div>

      <div className="text-center mt-8">
        <p className="font-sans text-sm text-[var(--color-on-surface-variant)]">
          {t('auth.signIn')}{' '}
          <button
            type="button"
            onClick={onSwitchMode}
            className="text-[var(--color-primary)] hover:underline border-b border-[var(--color-primary)] pb-0.5"
          >
            {t('auth.loginTitle')}
          </button>
        </p>
      </div>
    </div>
  )
}
