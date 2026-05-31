'use client'

import { useState, useTransition } from 'react'
import { signOut } from 'next-auth/react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { useStatus } from '../useStatus'
import { StatusBanner } from '../StatusBanner'
import { inputCls, inputErrCls, labelCls, primaryBtn } from '../formStyles'

interface EmailSectionProps {
  initialEmail: string
}

export function EmailSection({ initialEmail }: EmailSectionProps) {
  const { t } = usePreferences()
  const [email, setEmail] = useState(initialEmail)
  const [newEmail, setNewEmail] = useState('')
  const [emailPwd, setEmailPwd] = useState('')
  const [emailErrors, setEmailErrors] = useState<Record<string, string>>({})
  const emailStatus = useStatus()
  const [emailPending, startEmail] = useTransition()

  function submitEmail(e: React.FormEvent) {
    e.preventDefault()
    setEmailErrors({})
    emailStatus.set({ kind: 'loading' })
    startEmail(async () => {
      try {
        const res = await fetch('/api/settings/account/email', {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ newEmail, currentPassword: emailPwd }),
        })
        const data = await res.json()
        if (!res.ok) {
          setEmailErrors(data?.error?.fields ?? {})
          emailStatus.set({
            kind: 'error',
            message: data?.error?.message ?? t('settings.saveError'),
          })
          return
        }
        setEmail(data.email)
        setNewEmail('')
        setEmailPwd('')
        emailStatus.set({ kind: 'success', message: t('settings.emailChanged') })
        // Cambio de email rota tokenVersion → sesión expira en próximo request.
        setTimeout(() => signOut({ callbackUrl: '/login' }), 1200)
      } catch {
        emailStatus.set({ kind: 'error', message: t('settings.saveError') })
      }
    })
  }

  return (
    <form onSubmit={submitEmail} className="space-y-4" noValidate>
      <h4 className="font-sans font-semibold text-lg text-[var(--color-primary)]">
        {t('settings.changeEmail')}
      </h4>
      <div className="space-y-2">
        <label className={labelCls}>{t('settings.email')}</label>
        <input type="email" value={email} disabled className={inputCls + ' opacity-60 cursor-not-allowed'} />
      </div>
      <div className="space-y-2">
        <label htmlFor="newEmail" className={labelCls}>
          {t('settings.newEmail')}
        </label>
        <input
          id="newEmail"
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          required
          className={inputCls + (emailErrors.newEmail ? inputErrCls : '')}
        />
        {emailErrors.newEmail && (
          <p className="text-xs text-[var(--color-error)] font-mono">{emailErrors.newEmail}</p>
        )}
      </div>
      <div className="space-y-2">
        <label htmlFor="emailPwd" className={labelCls}>
          {t('settings.currentPassword')}
        </label>
        <input
          id="emailPwd"
          type="password"
          autoComplete="current-password"
          value={emailPwd}
          onChange={(e) => setEmailPwd(e.target.value)}
          required
          className={inputCls + (emailErrors.currentPassword ? inputErrCls : '')}
        />
        {emailErrors.currentPassword && (
          <p className="text-xs text-[var(--color-error)] font-mono">{emailErrors.currentPassword}</p>
        )}
      </div>
      <StatusBanner status={emailStatus.status} />
      <button
        type="submit"
        disabled={emailPending || !newEmail || !emailPwd}
        className={primaryBtn}
      >
        {emailPending ? t('settings.saving') : t('settings.changeEmail')}
      </button>
    </form>
  )
}
