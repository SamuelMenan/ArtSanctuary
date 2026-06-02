'use client'

import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import type { Locale, ThemeMode } from '@shared/i18n'

const labelCls =
  'font-mono text-label-sm tracking-widest uppercase text-[var(--color-on-surface-variant)]'

function SegBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-4 py-2 rounded-sm font-mono text-xs tracking-widest uppercase border transition-colors ${
        active
          ? 'bg-(--color-primary) text-(--color-on-primary) border-outline'
          : 'bg-transparent text-on-surface-variant border-outline-variant hover:border-(--color-primary) hover:text-(--color-primary)'
      }`}
    >
      {children}
    </button>
  )
}

export function AppearanceForm() {
  const { theme, locale, setTheme, setLocale, t } = usePreferences()

  const themes: { value: ThemeMode; label: string }[] = [
    { value: 'light', label: t('settings.themeLight') },
    { value: 'dark', label: t('settings.themeDark') },
    { value: 'system', label: t('settings.themeSystem') },
  ]

  const locales: { value: Locale; label: string }[] = [
    { value: 'es', label: t('settings.languageEs') },
    { value: 'en', label: t('settings.languageEn') },
  ]

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <span className={labelCls}>{t('settings.theme')}</span>
        <div role="group" aria-label={t('settings.theme')} className="flex flex-wrap gap-3">
          {themes.map((opt) => (
            <SegBtn key={opt.value} active={theme === opt.value} onClick={() => setTheme(opt.value)}>
              {opt.label}
            </SegBtn>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <span className={labelCls}>{t('settings.language')}</span>
        <div role="group" aria-label={t('settings.language')} className="flex flex-wrap gap-3">
          {locales.map((opt) => (
            <SegBtn key={opt.value} active={locale === opt.value} onClick={() => setLocale(opt.value)}>
              {opt.label}
            </SegBtn>
          ))}
        </div>
      </div>
    </div>
  )
}
