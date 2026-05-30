import { NextRequest } from "next/server";
import { requireUser } from "@backend/auth/requireUser";
import { apiError, apiOk } from "@/lib/api/errors";
import { validatePreferences } from "@/lib/validation/settings";

export async function PATCH(req: NextRequest) {
  const r = await requireUser();
  if (!r.ok) return r.response;

  const body = await req.json().catch(() => null);
  const result = validatePreferences(body);
  if (!result.ok) return apiError("VALIDATION_ERROR", "Datos inválidos", result.fields);

  if (result.value.theme !== undefined) r.user.theme = result.value.theme;
  if (result.value.locale !== undefined) r.user.locale = result.value.locale;
  await r.user.save();

  return apiOk({ theme: r.user.theme, locale: r.user.locale });
}
