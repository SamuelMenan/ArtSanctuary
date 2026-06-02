import { requireUser } from "@backend/auth/requireUser";
import { apiError, apiOk } from "@backend/http/errors";
import { withErrorHandler } from "@backend/http/handler";
import { validatePassword } from "@shared/lib/validation/settings";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

export const PATCH = withErrorHandler("PATCH /api/settings/account/password", async (req: NextRequest) => {
  const r = await requireUser({ withPassword: true });
  if (!r.ok) return r.response;

  const body = await req.json().catch(() => null);
  if (typeof body !== "object" || body === null) {
    return apiError("VALIDATION_ERROR", "Cuerpo inválido");
  }
  const { currentPassword, newPassword, confirmPassword } = body as {
    currentPassword?: unknown;
    newPassword?: unknown;
    confirmPassword?: unknown;
  };

  if (typeof currentPassword !== "string" || !currentPassword) {
    return apiError("VALIDATION_ERROR", "Datos inválidos", {
      currentPassword: "Contraseña requerida",
    });
  }
  const pwdRes = validatePassword(newPassword);
  if (!pwdRes.ok) return apiError("VALIDATION_ERROR", "Datos inválidos", pwdRes.fields);
  if (newPassword !== confirmPassword) {
    return apiError("VALIDATION_ERROR", "Datos inválidos", {
      confirmPassword: "Las contraseñas no coinciden",
    });
  }

  const valid = await bcrypt.compare(currentPassword, r.user.passwordHash);
  if (!valid) {
    return apiError("FORBIDDEN", "Contraseña incorrecta", {
      currentPassword: "Contraseña incorrecta",
    });
  }

  r.user.passwordHash = await bcrypt.hash(pwdRes.value, 12);
  r.user.tokenVersion += 1;
  await r.user.save();

  return apiOk({ changed: true });
});
