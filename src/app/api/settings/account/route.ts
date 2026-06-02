import { requireUser } from "@backend/auth/requireUser";
import { apiError, apiOk } from "@backend/http/errors";
import { withErrorHandler } from "@backend/http/handler";
import { deleteAccountCascade } from "@backend/services/users.service";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

const CONFIRM_WORD = "ELIMINAR";

export const DELETE = withErrorHandler("DELETE /api/settings/account", async (req: NextRequest) => {
  const r = await requireUser({ withPassword: true });
  if (!r.ok) return r.response;

  const body = await req.json().catch(() => null);
  if (typeof body !== "object" || body === null) {
    return apiError("VALIDATION_ERROR", "Cuerpo inválido");
  }
  const { currentPassword, confirm } = body as {
    currentPassword?: unknown;
    confirm?: unknown;
  };

  if (typeof currentPassword !== "string" || !currentPassword) {
    return apiError("VALIDATION_ERROR", "Contraseña requerida", {
      currentPassword: "Contraseña requerida",
    });
  }
  if (confirm !== CONFIRM_WORD) {
    return apiError("VALIDATION_ERROR", `Escribe ${CONFIRM_WORD} para confirmar`, {
      confirm: `Debes escribir ${CONFIRM_WORD}`,
    });
  }
  const valid = await bcrypt.compare(currentPassword, r.user.passwordHash);
  if (!valid) {
    return apiError("FORBIDDEN", "Contraseña incorrecta", {
      currentPassword: "Contraseña incorrecta",
    });
  }

  await deleteAccountCascade(r.user._id.toString(), r.user.avatarUrl);

  return apiOk({ deleted: true });
});
