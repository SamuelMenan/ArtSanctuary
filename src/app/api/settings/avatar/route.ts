import { requireUser } from "@backend/auth/requireUser";
import { apiError, apiOk } from "@backend/http/errors";
import { withErrorHandler } from "@backend/http/handler";
import {
    AVATAR_ALLOWED_MIME,
    AVATAR_MAX_BYTES,
    deleteAvatarFile,
    saveAvatar,
} from "@backend/upload/avatar";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export const POST = withErrorHandler("POST /api/settings/avatar", async (req: NextRequest) => {
  const r = await requireUser();
  if (!r.ok) return r.response;

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.startsWith("multipart/form-data")) {
    return apiError("UNSUPPORTED_MEDIA_TYPE", "Se espera multipart/form-data");
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return apiError("VALIDATION_ERROR", "Falta el archivo 'file'", { file: "Archivo requerido" });
  }

  // Pre-validación rápida cliente-side ya cubierta; servidor revalida.
  if (!AVATAR_ALLOWED_MIME.includes(file.type as (typeof AVATAR_ALLOWED_MIME)[number])) {
    return apiError("UNSUPPORTED_MEDIA_TYPE", "Formato no soportado. Usa JPG, PNG o WebP.");
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return apiError("PAYLOAD_TOO_LARGE", "Archivo demasiado grande. Máximo 3MB.");
  }

  const saved = await saveAvatar(r.user._id.toString(), file);
  if (!saved.ok) return apiError(saved.code, saved.message);

  const previous = r.user.avatarUrl;
  r.user.avatarUrl = saved.url;
  await r.user.save();
  if (previous) await deleteAvatarFile(previous);

  return apiOk({ avatarUrl: r.user.avatarUrl });
});

export const DELETE = withErrorHandler("DELETE /api/settings/avatar", async () => {
  const r = await requireUser();
  if (!r.ok) return r.response;

  const previous = r.user.avatarUrl;
  r.user.avatarUrl = "";
  await r.user.save();
  if (previous) await deleteAvatarFile(previous);

  return apiOk({ avatarUrl: "" });
});
