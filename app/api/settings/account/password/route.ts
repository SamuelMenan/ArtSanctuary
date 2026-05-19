import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { requireUser } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { validatePassword } from "@/lib/validation/settings";

export async function PATCH(req: NextRequest) {
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
}
