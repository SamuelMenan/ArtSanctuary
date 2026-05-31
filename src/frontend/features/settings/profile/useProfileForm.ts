'use client'

import { useMemo, useState, useTransition } from 'react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { useStatus } from '../useStatus'
import { clientValidate, diff, SOCIAL_KEYS, type ProfileInitial } from './profileLogic'

export function useProfileForm(initial: ProfileInitial) {
  const { t } = usePreferences()
  const [state, setState] = useState<ProfileInitial>(initial)
  const [savedInitial, setSavedInitial] = useState<ProfileInitial>(initial)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [pending, startTransition] = useTransition()
  const { status, set } = useStatus()

  const changed = useMemo(
    () => Object.keys(diff(savedInitial, state)).length > 0,
    [savedInitial, state],
  )
  const bioRemaining = 300 - state.bio.length

  function update<K extends keyof ProfileInitial>(key: K, value: ProfileInitial[K]) {
    setState((s) => ({ ...s, [key]: value }))
    setFieldErrors((e) => {
      if (!e[key as string]) return e
      const next = { ...e }
      delete next[key as string]
      return next
    })
  }

  function updateSocial(k: (typeof SOCIAL_KEYS)[number], value: string) {
    setState((s) => ({ ...s, socials: { ...s.socials, [k]: value } }))
    setFieldErrors((e) => {
      const key = `socials.${k}`
      if (!e[key]) return e
      const next = { ...e }
      delete next[key]
      return next
    })
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = clientValidate(state)
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      set({ kind: 'error', message: t('settings.requiredFields') })
      return
    }
    const payload = diff(savedInitial, state)
    if (Object.keys(payload).length === 0) {
      set({ kind: 'error', message: t('settings.noChanges') })
      return
    }

    set({ kind: 'loading' })
    startTransition(async () => {
      try {
        const res = await fetch('/api/settings/profile', {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) {
          setFieldErrors(data?.error?.fields ?? {})
          set({
            kind: 'error',
            message: data?.error?.message ?? t('settings.saveError'),
            fields: data?.error?.fields,
          })
          return
        }
        setSavedInitial(state)
        setFieldErrors({})
        set({ kind: 'success', message: t('settings.saved') })
      } catch {
        set({ kind: 'error', message: t('settings.saveError') })
      }
    })
  }

  return {
    t,
    state,
    fieldErrors,
    pending,
    status,
    changed,
    bioRemaining,
    update,
    updateSocial,
    onSubmit,
  }
}
