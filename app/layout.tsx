import type { Metadata } from 'next'
import { Manrope, JetBrains_Mono } from 'next/font/google'
import '@/app/globals.css'
import Providers from '@/components/Providers'
import { auth } from '@backend/auth'
import { connectDB } from '@backend/db/mongoose'
import { getRequestLocale, getRequestTheme } from '@backend/requestPreferences'
import { normalizeLocale, normalizeTheme } from '@/lib/i18n'
import User from '@backend/models/User'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ArtSanctuary',
  description: 'Your Creative Sanctuary',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  let initialLocale = await getRequestLocale()
  let initialTheme = await getRequestTheme()

  if (session?.user?.id) {
    await connectDB()
    const user = await User.findById(session.user.id).select('locale theme').lean()
    initialLocale = normalizeLocale(user?.locale)
    initialTheme = normalizeTheme(user?.theme)
  }

  return (
    <html lang={initialLocale} className={`${initialTheme} ${manrope.variable} ${jetbrainsMono.variable}`} data-authenticated={session?.user?.id ? 'true' : 'false'} suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased font-sans bg-background text-on-background min-h-screen" suppressHydrationWarning>
        <Providers initialLocale={initialLocale} initialTheme={initialTheme} userId={session?.user?.id}>
          {children}
        </Providers>
      </body>
    </html>
  )
}
