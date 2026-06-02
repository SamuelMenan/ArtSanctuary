import { requireUser } from "@backend/auth/requireUser";
import { apiError, apiOk } from "@backend/http/errors";
import { withErrorHandler } from "@backend/http/handler";
import { validateNotifications } from "@shared/lib/validation/settings";
import { NextRequest } from "next/server";

export const PATCH = withErrorHandler("PATCH /api/settings/notifications", async (req: NextRequest) => {
  const r = await requireUser();
  if (!r.ok) return r.response;

  const body = await req.json().catch(() => null);
  const result = validateNotifications(body);
  if (!result.ok) return apiError("VALIDATION_ERROR", "Datos inválidos", result.fields);

  r.user.notificationSettings = { ...r.user.notificationSettings, ...result.value };
  await r.user.save();

  return apiOk({ notificationSettings: r.user.notificationSettings });
});
