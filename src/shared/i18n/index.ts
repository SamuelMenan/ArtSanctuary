// IMPORTANTE: este módulo NO importa los diccionarios estáticamente. Lo consume
// el provider de cliente, así que un import estático arrastraría AMBOS idiomas al
// bundle de cada página. El idioma activo llega por prop desde el servidor; los
// cambios en cliente usan `loadDictionary` (import dinámico → un chunk por idioma).
// El acceso síncrono en servidor vive en `./dictionaries` (server-only).

export const LOCALE_COOKIE = 'artsanctuary-locale'
export const THEME_COOKIE = 'artsanctuary-theme'

export type Locale = 'es' | 'en'
export type ThemeMode = 'dark' | 'light' | 'system'
export type ResolvedTheme = 'dark' | 'light'

export const defaultLocale: Locale = 'es'
export const defaultTheme: ThemeMode = 'dark'

// Tipo derivado de ambos diccionarios (import type-only: sin coste en runtime).
export type TranslationDictionary =
  | (typeof import('./messages/es'))['es']
  | (typeof import('./messages/en'))['en']

/** Carga el diccionario de un idioma bajo demanda (un chunk por idioma). */
export async function loadDictionary(locale: Locale): Promise<TranslationDictionary> {
  const m = await import(`./messages/${locale}`)
  return (m as Record<string, TranslationDictionary>)[locale]
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

/**
 * Traduce los valores de un mapa de errores de campo (clave i18n → texto). Las
 * cadenas que no sean claves conocidas pasan tal cual (t devuelve la clave).
 */
export function translateFields(
  fields: Record<string, string> | undefined,
  translate: (key: string) => string,
): Record<string, string> {
  if (!fields) return {}
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, translate(v)]))
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
