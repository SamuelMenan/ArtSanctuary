import { requireUser } from "@backend/auth/requireUser";
import { apiError, apiOk } from "@backend/http/errors";
import { withErrorHandler } from "@backend/http/handler";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

export const POST = withErrorHandler("POST /api/settings/account/deactivate", async (req: NextRequest) => {
  const r = await requireUser({ withPassword: true });
  if (!r.ok) return r.response;

  const body = await req.json().catch(() => null);
  const currentPassword =
    typeof body === "object" && body && "currentPassword" in body
      ? (body as { currentPassword: unknown }).currentPassword
      : null;

  if (typeof currentPassword !== "string" || !currentPassword) {
    return apiError("VALIDATION_ERROR", "Contraseña requerida", {
      currentPassword: "Contraseña requerida",
    });
  }
  const valid = await bcrypt.compare(currentPassword, r.user.passwordHash);
  if (!valid) {
    return apiError("FORBIDDEN", "Contraseña incorrecta", {
      currentPassword: "Contraseña incorrecta",
    });
  }

  r.user.status = "deactivated";
  r.user.tokenVersion += 1;
  await r.user.save();

  return apiOk({ status: r.user.status });
});
