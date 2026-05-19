import { auth } from '@/auth'
import { connectDB } from '@/lib/mongodb'
import { normalizeLocale, normalizeTheme } from '@/lib/i18n'
import User from '@/models/User'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const locale = normalizeLocale(body.locale)
  const theme = normalizeTheme(body.theme)

  await connectDB()
  await User.findByIdAndUpdate(session.user.id, { locale, theme })

  return NextResponse.json({ ok: true, locale, theme })
}
