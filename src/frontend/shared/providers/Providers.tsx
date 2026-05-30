'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import AppPreferencesProvider from './AppPreferencesProvider';
import type { Locale, ThemeMode } from '@shared/i18n';

export default function Providers({
  children,
  initialLocale,
  initialTheme,
  userId,
}: {
  children: ReactNode;
  initialLocale?: Locale;
  initialTheme?: ThemeMode;
  userId?: string | null;
}) {
  return (
    <SessionProvider>
      <AppPreferencesProvider initialLocale={initialLocale} initialTheme={initialTheme} userId={userId}>
        {children}
      </AppPreferencesProvider>
    </SessionProvider>
  );
}
