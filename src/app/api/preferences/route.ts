import { auth } from '@backend/auth';
import { apiError } from "@backend/http/errors";
import { withErrorHandler } from "@backend/http/handler";
import { updateUserPreferences } from '@backend/services/users.service';
import { normalizeLocale, normalizeTheme } from '@shared/i18n';
import { NextRequest, NextResponse } from 'next/server';

export const PATCH = withErrorHandler("PATCH /api/preferences", async (req: NextRequest) => {
  const session = await auth()
  if (!session?.user?.id) {
    return apiError("UNAUTHORIZED", 'No autenticado');
  }

  const body = await req.json().catch(() => ({}))
  const locale = normalizeLocale(body.locale)
  const theme = normalizeTheme(body.theme)

  await updateUserPreferences(session.user.id, { locale, theme })

  return NextResponse.json({ ok: true, locale, theme })
});
