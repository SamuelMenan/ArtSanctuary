'use client'

import { useState, useTransition } from 'react'
import { signOut } from 'next-auth/react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { useStatus } from '../useStatus'
import { StatusBanner } from '../StatusBanner'
import { inputCls, inputErrCls, labelCls, primaryBtn } from '../formStyles'

export function PasswordSection() {
  const { t } = usePreferences()
  const [curPwd, setCurPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confPwd, setConfPwd] = useState('')
  const [pwdErrors, setPwdErrors] = useState<Record<string, string>>({})
  const pwdStatus = useStatus()
  const [pwdPending, startPwd] = useTransition()

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

  return (
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
  )
}
