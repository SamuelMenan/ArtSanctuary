import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { requireUser } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";

export async function POST(req: NextRequest) {
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
}
