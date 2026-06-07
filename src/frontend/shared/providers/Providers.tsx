'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import AppPreferencesProvider from './AppPreferencesProvider';
import CollectionsProvider from './CollectionsProvider';
import ChromeProvider from '@frontend/shared/layouts/ChromeProvider';
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
        <CollectionsProvider userId={userId}>
          {/* Chrome (sidebars/navbar) a nivel raíz: una sola instancia que
              persiste entre navegaciones → el ocultar/mostrar ANIMA en vez de
              aparecer en estado final (evita el salto brusco al cambiar de tool). */}
          <ChromeProvider>{children}</ChromeProvider>
        </CollectionsProvider>
      </AppPreferencesProvider>
    </SessionProvider>
  );
}
