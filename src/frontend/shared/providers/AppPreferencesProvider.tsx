'use client'

import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createTranslator,
  defaultLocale,
  defaultTheme,
  loadDictionary,
  LOCALE_COOKIE,
  normalizeLocale,
  normalizeTheme,
  resolveTheme,
  THEME_COOKIE,
  type Locale,
  type ResolvedTheme,
  type ThemeMode,
  type TranslationDictionary,
} from '@shared/i18n'

type PreferencesContextValue = {
  locale: Locale
  theme: ThemeMode
  resolvedTheme: ResolvedTheme
  setLocale: (locale: Locale) => void
  setTheme: (theme: ThemeMode) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null)

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`
}

function applyDom(locale: Locale, resolved: ResolvedTheme) {
  document.documentElement.lang = locale
  document.documentElement.classList.remove('dark', 'light')
  document.documentElement.classList.add(resolved)
  document.documentElement.style.colorScheme = resolved
}

export default function AppPreferencesProvider({
  children,
  initialLocale = defaultLocale,
  initialTheme = defaultTheme,
  initialDictionary,
  userId,
}: {
  children: React.ReactNode
  initialLocale?: Locale
  initialTheme?: ThemeMode
  initialDictionary: TranslationDictionary
  userId?: string | null
}) {
  const router = useRouter()
  const [locale, setLocaleState] = useState<Locale>(() => normalizeLocale(initialLocale))
  const [theme, setThemeState] = useState<ThemeMode>(() => normalizeTheme(initialTheme))
  const [systemDark, setSystemDark] = useState<boolean>(false)
  // Diccionario del idioma activo. Inicial llega del servidor (solo ese idioma
  // viaja al bundle); al cambiar de idioma se carga el otro chunk bajo demanda.
  const [dict, setDict] = useState<TranslationDictionary>(initialDictionary)

  // Sigue cambios del SO solo si el tema es 'system'.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    setSystemDark(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const resolvedTheme = useMemo<ResolvedTheme>(
    () => resolveTheme(theme, systemDark),
    [theme, systemDark],
  )

  useEffect(() => {
    applyDom(locale, resolvedTheme)
    writeCookie(LOCALE_COOKIE, locale)
    writeCookie(THEME_COOKIE, theme)
    localStorage.setItem(LOCALE_COOKIE, locale)
    localStorage.setItem(THEME_COOKIE, theme)
  }, [locale, theme, resolvedTheme])

  const persist = useCallback(async (nextLocale: Locale, nextTheme: ThemeMode) => {
    if (!userId) return
    try {
      await fetch('/api/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: nextLocale, theme: nextTheme }),
      })
    } catch {
      // Cookies y estado local siguen siendo fuente de verdad si falla la red.
    }
  }, [userId])

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale)
    void loadDictionary(nextLocale).then(setDict)
    void persist(nextLocale, theme)
    router.refresh()
  }, [persist, theme, router])

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    setThemeState(nextTheme)
    void persist(locale, nextTheme)
  }, [persist, locale])

  const value = useMemo(() => {
    return {
      locale,
      theme,
      resolvedTheme,
      setLocale,
      setTheme,
      t: createTranslator(dict),
    }
  }, [locale, theme, resolvedTheme, dict, setLocale, setTheme])

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences() {
  const ctx = use(PreferencesContext)
  if (!ctx) throw new Error('usePreferences must be used within AppPreferencesProvider')
  return ctx
}
