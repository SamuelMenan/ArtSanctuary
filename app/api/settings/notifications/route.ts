import { NextRequest } from "next/server";
import { requireUser } from "@backend/auth/requireUser";
import { apiError, apiOk } from "@/lib/api/errors";
import { validateNotifications } from "@/lib/validation/settings";

export async function PATCH(req: NextRequest) {
  const r = await requireUser();
  if (!r.ok) return r.response;

  const body = await req.json().catch(() => null);
  const result = validateNotifications(body);
  if (!result.ok) return apiError("VALIDATION_ERROR", "Datos inválidos", result.fields);

  r.user.notificationSettings = { ...r.user.notificationSettings, ...result.value };
  await r.user.save();

  return apiOk({ notificationSettings: r.user.notificationSettings });
}
