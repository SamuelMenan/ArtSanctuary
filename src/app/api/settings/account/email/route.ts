import { requireUser } from "@backend/auth/requireUser";
import { apiError, apiOk } from "@backend/http/errors";
import { withErrorHandler } from "@backend/http/handler";
import { isEmailTaken } from "@backend/services/users.service";
import { validateEmail } from "@shared/lib/validation/settings";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

export const PATCH = withErrorHandler("PATCH /api/settings/account/email", async (req: NextRequest) => {
  const r = await requireUser({ withPassword: true });
  if (!r.ok) return r.response;

  const body = await req.json().catch(() => null);
  if (typeof body !== "object" || body === null) {
    return apiError("VALIDATION_ERROR", "Cuerpo inválido");
  }
  const { newEmail, currentPassword } = body as { newEmail?: unknown; currentPassword?: unknown };

  const emailRes = validateEmail(newEmail);
  if (!emailRes.ok) return apiError("VALIDATION_ERROR", "Datos inválidos", emailRes.fields);

  if (typeof currentPassword !== "string" || !currentPassword) {
    return apiError("VALIDATION_ERROR", "Datos inválidos", {
      currentPassword: "Contraseña requerida",
    });
  }
  const valid = await bcrypt.compare(currentPassword, r.user.passwordHash);
  if (!valid) {
    return apiError("FORBIDDEN", "Contraseña incorrecta", {
      currentPassword: "Contraseña incorrecta",
    });
  }

  if (emailRes.value === r.user.email) {
    return apiOk({ email: r.user.email, changed: false });
  }

  const dup = await isEmailTaken(emailRes.value, r.user._id.toString());
  if (dup) {
    return apiError("CONFLICT", "Email en uso", { newEmail: "Email en uso" });
  }

  // Sin servicio mail: aplicamos el cambio directo. Estructura preparada para
  // doble paso vía `emailPendingChange` + token cuando se integre proveedor SMTP.
  r.user.email = emailRes.value;
  r.user.emailPendingChange = null;
  r.user.tokenVersion += 1;
  await r.user.save();

  return apiOk({ email: r.user.email, changed: true });
});
