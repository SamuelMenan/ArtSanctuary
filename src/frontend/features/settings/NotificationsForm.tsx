'use client'

import { useState, useTransition } from 'react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { Toggle } from './Toggle'
import { useStatus } from './useStatus'
import { StatusBanner } from './StatusBanner'

type T = (key: string, vars?: Record<string, string | number>) => string

export interface NotificationSettings {
  likes: boolean
  comments: boolean
  follows: boolean
  saves: boolean
  weeklyDigest: boolean
}

interface Props {
  initial: NotificationSettings
}

export function NotificationsForm({ initial }: Props) {
  const { t } = usePreferences()
  const [state, setState] = useState<NotificationSettings>(() => initial)
  const [pending, start] = useTransition()
  const { status, set } = useStatus()

  function toggle<K extends keyof NotificationSettings>(key: K) {
    const next = { ...state, [key]: !state[key] }
    setState(next)
    set({ kind: 'loading' })
    start(async () => {
      try {
        const res = await fetch('/api/settings/notifications', {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ [key]: next[key] }),
        })
        if (!res.ok) {
          setState(state) // rollback
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

  const items: Array<{ key: keyof NotificationSettings; label: string; hint: string }> = [
    { key: 'likes', label: t('settings.notifLikes'), hint: t('settings.notifLikesHint') },
    { key: 'comments', label: t('settings.notifComments'), hint: t('settings.notifCommentsHint') },
    { key: 'follows', label: t('settings.notifFollows'), hint: t('settings.notifFollowsHint') },
    { key: 'saves', label: t('settings.notifSaves'), hint: t('settings.notifSavesHint') },
    {
      key: 'weeklyDigest',
      label: t('settings.notifWeekly'),
      hint: t('settings.notifWeeklyHint'),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="rounded-sm border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] px-4">
        {items.map((it) => (
          <Toggle
            key={it.key}
            id={`notif-${it.key}`}
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
