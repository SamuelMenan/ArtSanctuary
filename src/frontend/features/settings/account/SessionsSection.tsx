'use client'

import { useTransition } from 'react'
import { signOut } from 'next-auth/react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { useStatus } from '../useStatus'
import { StatusBanner } from '../StatusBanner'
import { ghostBtn } from '../formStyles'

export function SessionsSection() {
  const { t } = usePreferences()
  const sessionsStatus = useStatus()
  const [sessionsPending, startSessions] = useTransition()

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
  )
}
