'use client'

import { useState, useTransition } from 'react'
import { usePreferences } from '@/components/AppPreferencesProvider'
import { Toggle } from './Toggle'
import { useStatus } from './useStatus'
import { StatusBanner } from './StatusBanner'

type T = (key: string, vars?: Record<string, string | number>) => string

export interface PrivacySettings {
  profilePublic: boolean
  showEmail: boolean
  allowMessages: boolean
  allowFollow: boolean
}

interface Props {
  initial: PrivacySettings
}

export function PrivacyForm({ initial }: Props) {
  const { t } = usePreferences()
  const [state, setState] = useState<PrivacySettings>(initial)
  const [pending, start] = useTransition()
  const { status, set } = useStatus()

  function toggle<K extends keyof PrivacySettings>(key: K) {
    const next = { ...state, [key]: !state[key] }
    setState(next)
    set({ kind: 'loading' })
    start(async () => {
      try {
        const res = await fetch('/api/settings/privacy', {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ [key]: next[key] }),
        })
        if (!res.ok) {
          setState(state)
          set({ kind: 'error', message: t('settings.saveError') })
          return
        }
        set({ kind: 'success', message: t('settings.saved') })
      } catch {
        setState(state)
        set({ kind: 'error', message: t('settings.saveError') })
      }
    })
  }

  const items: Array<{ key: keyof PrivacySettings; label: string; hint: string }> = [
    {
      key: 'profilePublic',
      label: t('settings.privacyPublic'),
      hint: t('settings.privacyPublicHint'),
    },
    {
      key: 'showEmail',
      label: t('settings.privacyShowEmail'),
      hint: t('settings.privacyShowEmailHint'),
    },
    {
      key: 'allowMessages',
      label: t('settings.privacyAllowMessages'),
      hint: t('settings.privacyAllowMessagesHint'),
    },
    {
      key: 'allowFollow',
      label: t('settings.privacyAllowFollow'),
      hint: t('settings.privacyAllowFollowHint'),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="rounded-sm border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] px-4">
        {items.map((it) => (
          <Toggle
            key={it.key}
            id={`privacy-${it.key}`}
            label={it.label}
            hint={it.hint}
            checked={state[it.key]}
            onChange={() => toggle(it.key)}
            disabled={pending}
          />
        ))}
      </div>
      <StatusBanner status={status} />
    </div>
  )
}
