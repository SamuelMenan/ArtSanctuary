/**
 * Notifications Service
 * Listado y estado de lectura de notificaciones. Solo DB (POJOs). Sin HTTP.
 */
import "server-only";
import { connectDB } from "@backend/db/mongoose";
import Notification from "@backend/models/Notification";
// Registro de schemas referenciados por populate(): en una lambda serverless
// fría que toca esta ruta primero, Mongoose no conoce "User"/"Artwork" y
// populate lanza MissingSchemaError (500). Importarlos los registra.
import "@backend/models/User";
import "@backend/models/Artwork";

/** Últimas 20 notificaciones del usuario + nº sin leer. */
export async function getUserNotifications(userId: string) {
  await connectDB();
  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ recipientId: userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("actorId", "username displayName avatarUrl")
      .populate("artworkId", "title imageUrl")
      .lean(),
    Notification.countDocuments({ recipientId: userId, read: false }),
  ]);
  return { notifications, unreadCount };
}

/** Marca una notificación como leída si es del usuario. POJO o `null`. */
export async function markNotificationRead(id: string, userId: string) {
  await connectDB();
  return Notification.findOneAndUpdate(
    { _id: id, recipientId: userId },
    { read: true },
    { returnDocument: "after" },
  );
}

/** Marca todas las notificaciones del usuario como leídas. */
export async function markAllNotificationsRead(userId: string) {
  await connectDB();
  await Notification.updateMany({ recipientId: userId, read: false }, { read: true });
}
