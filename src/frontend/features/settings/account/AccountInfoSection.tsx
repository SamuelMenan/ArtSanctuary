'use client'

import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { labelCls } from '../formStyles'

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

interface AccountInfoSectionProps {
  createdAt: string
  lastLoginAt: string | null
  locale: string
}

export function AccountInfoSection({ createdAt, lastLoginAt, locale }: AccountInfoSectionProps) {
  const { t } = usePreferences()

  return (
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
  )
}
