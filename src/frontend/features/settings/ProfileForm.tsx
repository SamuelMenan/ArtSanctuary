'use client'

import { useMemo, useState, useTransition } from 'react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { useStatus } from './useStatus'
import { StatusBanner } from './StatusBanner'

type T = (key: string, vars?: Record<string, string | number>) => string

export interface ProfileInitial {
  displayName: string
  username: string
  bio: string
  location: string
  website: string
  socials: {
    twitter?: string
    instagram?: string
    behance?: string
    artstation?: string
    tiktok?: string
  }
}

const SOCIAL_KEYS = ['twitter', 'instagram', 'behance', 'artstation', 'tiktok'] as const
const USERNAME_RE = /^[a-z0-9_]{3,30}$/
const URL_RE = /^https?:\/\/[^\s/$.?#].[^\s]*$/i

function clientValidate(state: ProfileInitial): Record<string, string> {
  const f: Record<string, string> = {}
  if (state.displayName.length > 60) f.displayName = 'Máximo 60 caracteres'
  if (state.username && !USERNAME_RE.test(state.username)) {
    f.username = '3-30: minúsculas, números, _'
  }
  if (state.bio.length > 300) f.bio = 'Máximo 300 caracteres'
  if (state.location.length > 80) f.location = 'Máximo 80 caracteres'
  if (state.website && !URL_RE.test(state.website)) f.website = 'URL inválida'
  for (const k of SOCIAL_KEYS) {
    const v = state.socials[k]
    if (v && !URL_RE.test(v)) f[`socials.${k}`] = 'URL inválida'
  }
  return f
}

function diff(initial: ProfileInitial, current: ProfileInitial): Partial<ProfileInitial> {
  const out: Partial<ProfileInitial> = {}
  if (initial.displayName !== current.displayName) out.displayName = current.displayName
  if (initial.username !== current.username) out.username = current.username
  if (initial.bio !== current.bio) out.bio = current.bio
  if (initial.location !== current.location) out.location = current.location
  if (initial.website !== current.website) out.website = current.website
  const socialsChanged = SOCIAL_KEYS.some(
    (k) => (initial.socials[k] ?? '') !== (current.socials[k] ?? ''),
  )
  if (socialsChanged) out.socials = current.socials
  return out
}

const inputCls =
  'w-full bg-[var(--color-surface-container)] border border-[var(--color-surface-container-high)] rounded-sm px-4 py-3 text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors font-sans'
const inputErrCls = ' border-[var(--color-error)] focus:border-[var(--color-error)]'
const labelCls =
  'font-mono text-[var(--text-label-sm)] tracking-widest uppercase text-[var(--color-on-surface-variant)]'

interface Props {
  initial: ProfileInitial
}

export function ProfileForm({ initial }: Props) {
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

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field
          label={t('settings.displayName')}
          error={fieldErrors.displayName}
          id="displayName"
        >
          <input
            id="displayName"
            type="text"
            value={state.displayName}
            maxLength={60}
            onChange={(e) => update('displayName', e.target.value)}
            className={inputCls + (fieldErrors.displayName ? inputErrCls : '')}
          />
        </Field>

        <Field label={t('settings.username')} error={fieldErrors.username} id="username">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)] font-sans">
              @
            </span>
            <input
              id="username"
              type="text"
              value={state.username}
              maxLength={30}
              onChange={(e) =>
                update('username', e.target.value.toLowerCase().replace(/\s+/g, ''))
              }
              className={inputCls.replace('px-4', 'pl-8 pr-4') + (fieldErrors.username ? inputErrCls : '')}
            />
          </div>
        </Field>
      </div>

      <Field
        label={t('settings.bio')}
        error={fieldErrors.bio}
        id="bio"
        hint={t('settings.charactersRemaining', { n: bioRemaining })}
      >
        <textarea
          id="bio"
          rows={4}
          value={state.bio}
          maxLength={300}
          onChange={(e) => update('bio', e.target.value)}
          placeholder={t('settings.bioPlaceholder')}
          className={inputCls + (fieldErrors.bio ? inputErrCls : '')}
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field label={t('settings.location')} error={fieldErrors.location} id="location">
          <input
            id="location"
            type="text"
            value={state.location}
            maxLength={80}
            onChange={(e) => update('location', e.target.value)}
            className={inputCls + (fieldErrors.location ? inputErrCls : '')}
          />
        </Field>

        <Field label={t('settings.website')} error={fieldErrors.website} id="website">
          <input
            id="website"
            type="url"
            inputMode="url"
            placeholder="https://"
            value={state.website}
            onChange={(e) => update('website', e.target.value)}
            className={inputCls + (fieldErrors.website ? inputErrCls : '')}
          />
        </Field>
      </div>

      <fieldset className="space-y-3">
        <legend className={labelCls + ' mb-2'}>{t('settings.socials')}</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SOCIAL_KEYS.map((k) => {
            const errKey = `socials.${k}`
            return (
              <div key={k} className="space-y-1">
                <label htmlFor={`s-${k}`} className="sr-only">
                  {k}
                </label>
                <input
                  id={`s-${k}`}
                  type="url"
                  inputMode="url"
                  placeholder={`https://${k}.com/...`}
                  value={state.socials[k] ?? ''}
                  onChange={(e) => updateSocial(k, e.target.value)}
                  className={inputCls + (fieldErrors[errKey] ? inputErrCls : '')}
                />
                {fieldErrors[errKey] && (
                  <p className="text-xs text-[var(--color-error)] font-mono">
                    {fieldErrors[errKey]}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </fieldset>

      <StatusBanner status={status} />

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={pending || !changed}
          className="bg-[var(--color-primary)] text-[var(--color-on-primary)] border border-[var(--color-outline)] shadow-[0_1px_0_var(--color-outline)] font-mono text-xs tracking-widest uppercase px-8 py-3 rounded-sm hover:bg-[var(--color-primary-container)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? t('settings.saving') : t('settings.saveChanges')}
        </button>
      </div>
    </form>
  )
}

function Field({
  label,
  error,
  hint,
  id,
  children,
}: {
  label: string
  error?: string
  hint?: string
  id: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      {children}
      <div className="flex justify-between text-xs font-mono min-h-[1rem]">
        {error ? (
          <span className="text-[var(--color-error)]">{error}</span>
        ) : hint ? (
          <span className="text-[var(--color-on-surface-variant)] opacity-70">{hint}</span>
        ) : (
          <span />
        )}
      </div>
    </div>
  )
}
