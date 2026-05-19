'use client'

import { useState, useTransition } from 'react'
import { signOut } from 'next-auth/react'
import { usePreferences } from '@/components/AppPreferencesProvider'
import { useStatus } from './useStatus'
import { StatusBanner } from './StatusBanner'

type T = (key: string, vars?: Record<string, string | number>) => string

const inputCls =
  'w-full bg-[var(--color-surface-container)] border border-[var(--color-surface-container-high)] rounded-sm px-4 py-3 text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors font-sans'
const inputErrCls = ' border-[var(--color-error)] focus:border-[var(--color-error)]'
const labelCls =
  'font-mono text-[var(--text-label-sm)] tracking-widest uppercase text-[var(--color-on-surface-variant)]'
const primaryBtn =
  'bg-[var(--color-primary)] text-[var(--color-on-primary)] border border-[var(--color-outline)] font-mono text-xs tracking-widest uppercase px-6 py-3 rounded-sm hover:bg-[var(--color-primary-container)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
const ghostBtn =
  'font-mono text-[var(--text-label-sm)] tracking-widest uppercase border border-[var(--color-outline-variant)] px-6 py-3 rounded-sm hover:border-[var(--color-primary)] transition-colors text-[var(--color-primary)] bg-transparent disabled:opacity-50'

function fmtDate(d?: string | null, locale = 'es') {
  if (!d) return null
  try {
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-ES', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date(d))
  } catch {
    return d
  }
}

interface Props {
  initialEmail: string
  createdAt: string
  lastLoginAt: string | null
  locale: string
}

export function AccountForm({ initialEmail, createdAt, lastLoginAt, locale }: Props) {
  const { t } = usePreferences()
  const [email, setEmail] = useState(initialEmail)
  const [newEmail, setNewEmail] = useState('')
  const [emailPwd, setEmailPwd] = useState('')
  const [emailErrors, setEmailErrors] = useState<Record<string, string>>({})
  const emailStatus = useStatus()
  const [emailPending, startEmail] = useTransition()

  const [curPwd, setCurPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confPwd, setConfPwd] = useState('')
  const [pwdErrors, setPwdErrors] = useState<Record<string, string>>({})
  const pwdStatus = useStatus()
  const [pwdPending, startPwd] = useTransition()

  const sessionsStatus = useStatus()
  const [sessionsPending, startSessions] = useTransition()

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

  function submitPwd(e: React.FormEvent) {
    e.preventDefault()
    setPwdErrors({})
    if (newPwd !== confPwd) {
      setPwdErrors({ confirmPassword: t('auth.passwordsMismatch') })
      pwdStatus.set({ kind: 'error', message: t('settings.requiredFields') })
      return
    }
    pwdStatus.set({ kind: 'loading' })
    startPwd(async () => {
      try {
        const res = await fetch('/api/settings/account/password', {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            currentPassword: curPwd,
            newPassword: newPwd,
            confirmPassword: confPwd,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setPwdErrors(data?.error?.fields ?? {})
          pwdStatus.set({
            kind: 'error',
            message: data?.error?.message ?? t('settings.saveError'),
          })
          return
        }
        setCurPwd('')
        setNewPwd('')
        setConfPwd('')
        pwdStatus.set({ kind: 'success', message: t('settings.passwordChanged') })
        setTimeout(() => signOut({ callbackUrl: '/login' }), 1200)
      } catch {
        pwdStatus.set({ kind: 'error', message: t('settings.saveError') })
      }
    })
  }

  function signOutAll() {
    sessionsStatus.set({ kind: 'loading' })
    startSessions(async () => {
      try {
        const res = await fetch('/api/settings/account/sessions', { method: 'DELETE' })
        if (!res.ok) {
          sessionsStatus.set({ kind: 'error', message: t('settings.saveError') })
          return
        }
        sessionsStatus.set({ kind: 'success', message: t('settings.sessionsCleared') })
        setTimeout(() => signOut({ callbackUrl: '/login' }), 1000)
      } catch {
        sessionsStatus.set({ kind: 'error', message: t('settings.saveError') })
      }
    })
  }

  return (
    <div className="space-y-12">
      {/* Email */}
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

      <hr className="border-[var(--color-outline-variant)] opacity-50" />

      {/* Password */}
      <form onSubmit={submitPwd} className="space-y-4" noValidate>
        <h4 className="font-sans font-semibold text-lg text-[var(--color-primary)]">
          {t('settings.changePassword')}
        </h4>
        <div className="space-y-2">
          <label htmlFor="curPwd" className={labelCls}>
            {t('settings.currentPassword')}
          </label>
          <input
            id="curPwd"
            type="password"
            autoComplete="current-password"
            value={curPwd}
            onChange={(e) => setCurPwd(e.target.value)}
            required
            className={inputCls + (pwdErrors.currentPassword ? inputErrCls : '')}
          />
          {pwdErrors.currentPassword && (
            <p className="text-xs text-[var(--color-error)] font-mono">{pwdErrors.currentPassword}</p>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="newPwd" className={labelCls}>
            {t('settings.newPassword')}
          </label>
          <input
            id="newPwd"
            type="password"
            autoComplete="new-password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            required
            className={inputCls + (pwdErrors.newPassword ? inputErrCls : '')}
          />
          <p className="text-xs text-[var(--color-on-surface-variant)] font-mono opacity-70">
            {t('settings.passwordRule')}
          </p>
          {pwdErrors.newPassword && (
            <p className="text-xs text-[var(--color-error)] font-mono">{pwdErrors.newPassword}</p>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="confPwd" className={labelCls}>
            {t('settings.confirmNewPassword')}
          </label>
          <input
            id="confPwd"
            type="password"
            autoComplete="new-password"
            value={confPwd}
            onChange={(e) => setConfPwd(e.target.value)}
            required
            className={inputCls + (pwdErrors.confirmPassword ? inputErrCls : '')}
          />
          {pwdErrors.confirmPassword && (
            <p className="text-xs text-[var(--color-error)] font-mono">{pwdErrors.confirmPassword}</p>
          )}
        </div>
        <StatusBanner status={pwdStatus.status} />
        <button
          type="submit"
          disabled={pwdPending || !curPwd || !newPwd || !confPwd}
          className={primaryBtn}
        >
          {pwdPending ? t('settings.saving') : t('settings.changePassword')}
        </button>
      </form>

      <hr className="border-[var(--color-outline-variant)] opacity-50" />

      {/* Sessions */}
      <div className="space-y-3">
        <h4 className="font-sans font-semibold text-lg text-[var(--color-primary)]">
          {t('settings.sessions')}
        </h4>
        <p className="text-sm text-[var(--color-on-surface-variant)]">
          {t('settings.signOutAllHint')}
        </p>
        <StatusBanner status={sessionsStatus.status} />
        <button type="button" onClick={signOutAll} disabled={sessionsPending} className={ghostBtn}>
          {sessionsPending ? t('settings.saving') : t('settings.signOutAll')}
        </button>
      </div>

      <hr className="border-[var(--color-outline-variant)] opacity-50" />

      {/* Account info */}
      <div className="space-y-3">
        <h4 className="font-sans font-semibold text-lg text-[var(--color-primary)]">
          {t('settings.accountInfo')}
        </h4>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans text-sm">
          <div>
            <dt className={labelCls}>{t('settings.memberSince')}</dt>
            <dd className="text-[var(--color-primary)] mt-1">{fmtDate(createdAt, locale)}</dd>
          </div>
          <div>
            <dt className={labelCls}>{t('settings.lastLogin')}</dt>
            <dd className="text-[var(--color-primary)] mt-1">
              {fmtDate(lastLoginAt, locale) ?? t('settings.never')}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
