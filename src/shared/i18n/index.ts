import { es } from './messages/es'
import { en } from './messages/en'

export const LOCALE_COOKIE = 'artsanctuary-locale'
export const THEME_COOKIE = 'artsanctuary-theme'

export type Locale = 'es' | 'en'
export type ThemeMode = 'dark' | 'light' | 'system'
export type ResolvedTheme = 'dark' | 'light'

export const defaultLocale: Locale = 'es'
export const defaultTheme: ThemeMode = 'dark'

// Diccionario por idioma, troceado en messages/<locale>.ts por legibilidad.
const messages = { es, en } as const

export type TranslationDictionary = (typeof messages)[Locale]

export function getDictionary(locale: Locale): TranslationDictionary {
  return messages[locale]
}

export function createTranslator(dictionary: TranslationDictionary) {
  return (key: string, vars?: Record<string, string | number>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = key.split('.').reduce<any>((acc, part) => acc?.[part], dictionary)
    if (typeof value !== 'string') return key
    if (!vars) return value

    return Object.entries(vars).reduce(
      (result, [name, replacement]) => result.replaceAll(`{{${name}}}`, String(replacement)),
      value,
    )
  }
}

export function normalizeLocale(locale?: string | null): Locale {
  return locale === 'en' ? 'en' : defaultLocale
}

export function normalizeTheme(theme?: string | null): ThemeMode {
  if (theme === 'light' || theme === 'dark' || theme === 'system') return theme
  return defaultTheme
}

export function resolveTheme(theme: ThemeMode, systemPrefersDark: boolean): ResolvedTheme {
  if (theme === 'system') return systemPrefersDark ? 'dark' : 'light'
  return theme
}

export { getCategoryLabel, getVisibilityLabel } from './labels'
