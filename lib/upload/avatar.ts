import crypto from "crypto";
import { put, del } from "@vercel/blob";

export const AVATAR_MAX_BYTES = 3 * 1024 * 1024; // 3MB
export const AVATAR_ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type SaveAvatarResult =
  | { ok: true; url: string }
  | { ok: false; code: "UNSUPPORTED_MEDIA_TYPE" | "PAYLOAD_TOO_LARGE"; message: string };

export async function saveAvatar(
  userId: string,
  file: File
): Promise<SaveAvatarResult> {
  if (!AVATAR_ALLOWED_MIME.includes(file.type as (typeof AVATAR_ALLOWED_MIME)[number])) {
    return {
      ok: false,
      code: "UNSUPPORTED_MEDIA_TYPE",
      message: "Formato no soportado. Usa JPG, PNG o WebP.",
    };
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return {
      ok: false,
      code: "PAYLOAD_TOO_LARGE",
      message: "Archivo demasiado grande. Máximo 3MB.",
    };
  }

  const ext = EXT_BY_MIME[file.type];
  const random = crypto.randomBytes(6).toString("hex");
  const key = `uploads/avatars/${userId}-${Date.now()}-${random}.${ext}`;

  const buf = Buffer.from(await file.arrayBuffer());
  const blob = await put(key, buf, {
    access: "public",
    contentType: file.type,
  });

  return { ok: true, url: blob.url };
}

export async function deleteAvatarFile(avatarUrl: string): Promise<void> {
  if (!avatarUrl) return;
  try {
    await del(avatarUrl);
  } catch {
    // blob gone or never existed — ignore
  }
}
