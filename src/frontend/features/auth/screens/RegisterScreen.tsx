'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'

export default function RegisterPage() {
  const { t } = usePreferences()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { push, refresh } = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError(t('auth.passwordsMismatch'))
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al registrar')
      }

      // Auto-login after successful registration
      const signInResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (signInResult?.error) {
        setError(t('auth.accountCreatedFallback'))
      } else {
        push('/')
        refresh()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] antialiased">
      {/* Decorative / Brand half (Hidden on mobile) */}
      <div className="hidden md:flex md:w-1/2 bg-[var(--color-surface)] flex-col justify-center items-center relative overflow-hidden p-[var(--spacing-container-padding)] border-r border-[var(--color-outline-variant)]">
        {/* Background Image - Hardcoded unsplash abstract for now */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10 grayscale mix-blend-overlay" 
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?auto=format&fit=crop&q=80')" }}
        />
        <div className="relative z-10 text-center max-w-md mx-auto">
          <h1 className="font-display-lg text-[var(--text-display-lg)] leading-[1.1] tracking-[-0.02em] text-[var(--color-primary)] font-semibold mb-6">
            ArtSanctuary
          </h1>
          <p className="font-mono text-[var(--text-label-sm)] tracking-[0.05em] text-[var(--color-secondary)] uppercase mb-4 font-medium">
            {t('home.heroLabel')}
          </p>
          <p className="font-sans text-[var(--text-body-md)] text-[var(--color-on-surface-variant)] italic">
            {t('home.heroTitle')}
          </p>
        </div>
        <div className="absolute bottom-[var(--spacing-container-padding)] left-[var(--spacing-container-padding)]">
          <p className="font-mono text-[var(--text-label-sm)] text-[var(--color-outline-variant)]">
            v0.1.0 · PASTO, NARIÑO
          </p>
        </div>
      </div>

      {/* Form half */}
      <div className="w-full md:w-1/2 flex justify-center items-center p-[var(--spacing-container-padding)] bg-[var(--color-surface-container-lowest)]">
        <div className="w-full max-w-[400px]">
          {/* Mobile Text Header */}
          <div className="md:hidden text-center mb-12">
            <h1 className="font-display-lg text-[var(--text-display-lg)] leading-[1.1] tracking-[-0.02em] text-[var(--color-primary)] font-semibold mb-4">
              ArtSanctuary
            </h1>
            <p className="font-mono text-[var(--text-label-sm)] tracking-[0.05em] text-[var(--color-secondary)] uppercase font-medium">
              {t('home.heroLabel')}
            </p>
          </div>

          {/* Register Card */}
          <div className="bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] rounded-[var(--radius-xl)] p-8 shadow-sm">
            <h2 className="font-sans text-[var(--text-headline-md)] text-[var(--color-primary)] mb-8 text-center uppercase tracking-wide font-semibold">
              {t('auth.createAccount')}
            </h2>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="p-3 bg-[var(--color-error-container)] text-[var(--color-on-error-container)] rounded-[var(--radius-sm)] text-sm font-sans border border-[var(--color-error)]">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block font-mono text-[var(--text-label-sm)] text-[var(--color-on-surface-variant)] uppercase tracking-widest mb-2" htmlFor="name-input">
                  {t('auth.artistName')}
                </label>
                <input
                  id="name-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] rounded-[var(--radius-sm)] p-3 focus:outline-none focus:border-[var(--color-primary)] transition-colors font-sans text-sm"
                  placeholder="Tu nombre artístico"
                  autoComplete="name"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block font-mono text-[var(--text-label-sm)] text-[var(--color-on-surface-variant)] uppercase tracking-widest mb-2" htmlFor="email-input">
                  {t('auth.email')}
                </label>
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] rounded-[var(--radius-sm)] p-3 focus:outline-none focus:border-[var(--color-primary)] transition-colors font-sans text-sm"
                  placeholder="correo@ejemplo.com"
                  autoComplete="email"
                  required
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block font-mono text-[var(--text-label-sm)] text-[var(--color-on-surface-variant)] uppercase tracking-widest mb-2" htmlFor="password-input">
                  {t('auth.password')}
                </label>
                <input
                  id="password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] rounded-[var(--radius-sm)] p-3 focus:outline-none focus:border-[var(--color-primary)] transition-colors font-sans text-sm"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>

              <div>
                <label className="block font-mono text-[var(--text-label-sm)] text-[var(--color-on-surface-variant)] uppercase tracking-widest mb-2" htmlFor="password-confirm-input">
                  {t('auth.confirmPassword')}
                </label>
                <input
                  id="password-confirm-input"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] rounded-[var(--radius-sm)] p-3 focus:outline-none focus:border-[var(--color-primary)] transition-colors font-sans text-sm"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-[var(--color-primary)] text-[var(--color-on-primary)] border border-[var(--color-outline)] shadow-[0_1px_0_var(--color-outline)] font-mono text-xs uppercase tracking-widest py-4 rounded-[var(--radius-sm)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-outline)] mt-4 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[var(--color-primary-container)]'}`}
              >
                {loading ? t('auth.creating') : t('auth.createAccount')}
              </button>
            </form>
          </div>

          <div className="text-center mt-8">
            <p className="font-sans text-sm text-[var(--color-on-surface-variant)]">
              {t('auth.signIn')}{' '}
              <Link href="/login" className="text-[var(--color-primary)] hover:underline border-b border-[var(--color-primary)] pb-0.5">
                {t('auth.loginTitle')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
