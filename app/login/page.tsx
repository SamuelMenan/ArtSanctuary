'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { usePreferences } from '@/components/AppPreferencesProvider'

export default function LoginPage() {
  const { t } = usePreferences()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { push, refresh } = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (res?.error) {
        setError(t('auth.incorrectCredentials'))
      } else {
        push('/')
        refresh()
      }
    } catch (err: any) {
      setError(t('auth.unexpectedError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] antialiased">
      {/* Decorative / Brand half (Hidden on mobile) */}
      <div className="hidden md:flex md:w-1/2 bg-[var(--color-surface)] flex-col justify-center items-center relative overflow-hidden p-[var(--spacing-container-padding)] border-r border-[var(--color-outline-variant)]">
        {/* Background Image - Hardcoded unsplash abstract for now, could be dynamic */}
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

          {/* Login Card */}
          <div className="bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] rounded-[var(--radius-xl)] p-8 shadow-sm">
            <h2 className="font-sans text-[var(--text-headline-md)] text-[var(--color-primary)] mb-8 text-center uppercase tracking-wide font-semibold">
              {t('auth.loginTitle')}
            </h2>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="p-3 bg-[var(--color-error-container)] text-[var(--color-on-error-container)] rounded-[var(--radius-sm)] text-sm font-sans border border-[var(--color-error)]">
                  {error}
                </div>
              )}
              
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
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />
                <div className="flex justify-end mt-2">
                  <Link href="#" className="font-sans text-xs text-[var(--color-outline)] hover:text-[var(--color-primary)] transition-colors">
                    {t('auth.forgotPassword')}
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-[var(--color-primary)] text-[var(--color-on-primary)] border border-[var(--color-outline)] shadow-[0_1px_0_var(--color-outline)] font-mono text-xs uppercase tracking-widest py-4 rounded-[var(--radius-sm)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-outline)] mt-4 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[var(--color-primary-container)]'}`}
              >
                {loading ? t('auth.signingIn') : t('auth.enter')}
              </button>
            </form>
          </div>

          <div className="text-center mt-8">
            <p className="font-sans text-sm text-[var(--color-on-surface-variant)]">
              {t('auth.noAccount')}{' '}
              <Link href="/register" className="text-[var(--color-primary)] hover:underline border-b border-[var(--color-primary)] pb-0.5">
                {t('auth.signUpLink')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
