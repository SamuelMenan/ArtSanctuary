'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import AppPreferencesProvider from './AppPreferencesProvider';
import type { Locale, ThemeMode, TranslationDictionary } from '@shared/i18n';

export default function Providers({
  children,
  initialLocale,
  initialTheme,
  initialDictionary,
  userId,
}: {
  children: ReactNode;
  initialLocale?: Locale;
  initialTheme?: ThemeMode;
  initialDictionary: TranslationDictionary;
  userId?: string | null;
}) {
  return (
    <SessionProvider>
      <AppPreferencesProvider initialLocale={initialLocale} initialTheme={initialTheme} initialDictionary={initialDictionary} userId={userId}>
        {children}
      </AppPreferencesProvider>
    </SessionProvider>
  );
}
