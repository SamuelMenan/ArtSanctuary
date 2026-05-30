import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "@backend/db/mongoose";
import { requireUser } from "@backend/auth/requireUser";
import { apiError, apiOk } from "@backend/http/errors";
import { deleteAvatarFile } from "@backend/upload/avatar";
import User from "@backend/models/User";
import Artwork from "@backend/models/Artwork";
import Collection from "@backend/models/Collection";
import Notification from "@backend/models/Notification";

const CONFIRM_WORD = "ELIMINAR";

export async function DELETE(req: NextRequest) {
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

  await connectDB();
  const userId = r.user._id;
  const avatar = r.user.avatarUrl;

  // Cascada. Sin transacciones (Mongo standalone): orden cuidadoso.
  // 1. Obras del autor → eliminar.
  // 2. Colecciones del owner → eliminar.
  // 3. Notificaciones donde el usuario es actor o destinatario → eliminar.
  // 4. Quitar el id de following/followers de otros usuarios.
  // 5. Eliminar el usuario.
  await Artwork.deleteMany({ artistId: userId });
  await Collection.deleteMany({ owner: userId });
  await Notification.deleteMany({
    $or: [{ recipientId: userId }, { actorId: userId }],
  });
  await User.updateMany(
    { $or: [{ following: userId }, { followers: userId }] },
    { $pull: { following: userId, followers: userId } }
  );
  await User.deleteOne({ _id: userId });

  if (avatar) await deleteAvatarFile(avatar);

  // Garantizamos cierre limpio aunque connectDB cachee la conexión.
  void mongoose;

  return apiOk({ deleted: true });
}
