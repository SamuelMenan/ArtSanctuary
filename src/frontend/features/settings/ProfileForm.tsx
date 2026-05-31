'use client'

import { StatusBanner } from './StatusBanner'
import { inputCls, inputErrCls } from './formStyles'
import { type ProfileInitial } from './profile/profileLogic'
import { useProfileForm } from './profile/useProfileForm'
import { Field } from './profile/Field'
import { SocialsFieldset } from './profile/SocialsFieldset'

export type { ProfileInitial }

interface Props {
  initial: ProfileInitial
}

export function ProfileForm({ initial }: Props) {
  const {
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
  } = useProfileForm(initial)

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

      <SocialsFieldset
        legend={t('settings.socials')}
        socials={state.socials}
        fieldErrors={fieldErrors}
        updateSocial={updateSocial}
      />

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
