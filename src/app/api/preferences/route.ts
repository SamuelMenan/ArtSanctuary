import { auth } from '@backend/auth'
import { normalizeLocale, normalizeTheme } from '@shared/i18n'
import { updateUserPreferences } from '@backend/services/users.service'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const locale = normalizeLocale(body.locale)
  const theme = normalizeTheme(body.theme)

  await updateUserPreferences(session.user.id, { locale, theme })

  return NextResponse.json({ ok: true, locale, theme })
}
