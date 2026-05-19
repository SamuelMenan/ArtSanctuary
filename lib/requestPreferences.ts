import { cookies } from 'next/headers'
import { LOCALE_COOKIE, THEME_COOKIE, defaultLocale, defaultTheme, type Locale, type ThemeMode } from './i18n'

export async function getRequestLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const locale = cookieStore.get(LOCALE_COOKIE)?.value
  return locale === 'en' ? 'en' : defaultLocale
}

export async function getRequestTheme(): Promise<ThemeMode> {
  const cookieStore = await cookies()
  const theme = cookieStore.get(THEME_COOKIE)?.value
  return theme === 'light' ? 'light' : defaultTheme
}
