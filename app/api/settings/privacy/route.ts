import { NextRequest } from "next/server";
import { requireUser } from "@backend/auth/requireUser";
import { apiError, apiOk } from "@backend/http/errors";
import { validatePrivacy } from "@shared/lib/validation/settings";

export async function PATCH(req: NextRequest) {
  const r = await requireUser();
  if (!r.ok) return r.response;

  const body = await req.json().catch(() => null);
  const result = validatePrivacy(body);
  if (!result.ok) return apiError("VALIDATION_ERROR", "Datos inválidos", result.fields);

  r.user.privacySettings = { ...r.user.privacySettings, ...result.value };
  await r.user.save();

  return apiOk({ privacySettings: r.user.privacySettings });
}
