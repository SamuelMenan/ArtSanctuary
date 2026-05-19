import { NextRequest } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import {
  AVATAR_ALLOWED_MIME,
  AVATAR_MAX_BYTES,
  deleteAvatarFile,
  saveAvatar,
} from "@/lib/upload/avatar";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
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
}

export async function DELETE() {
  const r = await requireUser();
  if (!r.ok) return r.response;

  const previous = r.user.avatarUrl;
  r.user.avatarUrl = "";
  await r.user.save();
  if (previous) await deleteAvatarFile(previous);

  return apiOk({ avatarUrl: "" });
}
