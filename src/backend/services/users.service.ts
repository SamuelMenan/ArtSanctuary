/**
 * Users Service
 * Perfiles, seguimiento y listas de conexiones. Solo DB (POJOs).
 * Sin HTTP ni React.
 */
import "server-only";
import { connectDB } from "@backend/db/mongoose";
import { deleteAvatarFile } from "@backend/upload/avatar";
import { deleteImage } from "@backend/upload/storage";
import User from "@backend/models/User";
import Artwork from "@backend/models/Artwork";
import Collection from "@backend/models/Collection";
import Notification from "@backend/models/Notification";

/** ¿El username está tomado por otro usuario? */
export async function isUsernameTaken(username: string, excludeUserId: string) {
  await connectDB();
  const exists = await User.findOne({ username, _id: { $ne: excludeUserId } });
  return !!exists;
}

/** ¿El email está tomado por otro usuario? */
export async function isEmailTaken(email: string, excludeUserId: string) {
  await connectDB();
  const dup = await User.findOne({ email, _id: { $ne: excludeUserId } });
  return !!dup;
}

/**
 * Borrado en cascada de la cuenta (Mongo standalone, sin transacciones):
 * obras, colecciones, notificaciones, referencias en follows, el usuario y su
 * avatar. Orden cuidadoso.
 */
export async function deleteAccountCascade(userId: string, avatarUrl?: string | null) {
  await connectDB();

  // Borrar los blobs ANTES que los documentos: una vez borrado el Artwork ya no
  // hay forma de saber qué imágenes le pertenecían y quedarían huérfanas para
  // siempre en Vercel Blob / public/uploads.
  const artworks = await Artwork.find({ artistId: userId }).select("imageUrl").lean();
  const collections = await Collection.find({ owner: userId }).select("references").lean();
  const imageUrls = [
    ...artworks.map((a) => a.imageUrl),
    ...collections.flatMap((c) => (c.references ?? []).map((r) => r.imageUrl)),
  ].filter((url): url is string => Boolean(url));
  // Best-effort e individual: `deleteImage` ya traga sus errores, y un fallo de
  // storage no debe impedir que la cuenta se borre.
  await Promise.all(imageUrls.map((url) => deleteImage(url)));

  await Artwork.deleteMany({ artistId: userId });
  await Collection.deleteMany({ owner: userId });
  await Notification.deleteMany({ $or: [{ recipientId: userId }, { actorId: userId }] });
  await User.updateMany(
    { $or: [{ following: userId }, { followers: userId }] },
    { $pull: { following: userId, followers: userId } },
  );
  await User.deleteOne({ _id: userId });
  if (avatarUrl) await deleteAvatarFile(avatarUrl);
}

/** Actualiza idioma/tema del usuario. */
export async function updateUserPreferences(userId: string, prefs: { locale: string; theme: string }) {
  await connectDB();
  await User.findByIdAndUpdate(userId, { locale: prefs.locale, theme: prefs.theme });
}

/** Documento de usuario por id (POJO lean) o `null`. Para los RSC de perfil/ajustes. */
export async function getUserById(id: string) {
  await connectDB();
  return User.findById(id).lean();
}

/** Perfil público por username + sus obras públicas, o `null` si no existe. */
export async function getPublicProfile(username: string) {
  await connectDB();
  const user = await User.findOne({ username: username.toLowerCase() })
    .select("username displayName bio avatarUrl location plan createdAt")
    .lean();
  if (!user) return null;

  // El modelo Artwork usa `artistId` y `visibility`, no `author`/`isPublic`.
  // Mongoose no valida campos desconocidos en un filtro de lectura, así que la
  // versión anterior devolvía [] siempre, en silencio.
  const artworks = await Artwork.find({ artistId: user._id, visibility: "public" })
    .sort({ uploadDate: -1 })
    .select("title imageUrl thumbnails category technique creationDate uploadDate")
    .lean();

  return { user, artworks };
}

/**
 * Sigue a un usuario (idempotente) + crea notificación. `null` si no existe o
 * si es un intento de auto-follow.
 */
export async function followUser(followerId: string, followingId: string) {
  // Sin esto, followUser(x, x) era válido y generaba una notificación de que
  // te sigues a ti mismo.
  if (followerId === followingId) return null;

  await connectDB();
  const userToFollow = await User.findByIdAndUpdate(
    followingId,
    { $addToSet: { followers: followerId } },
    { returnDocument: "after" },
  );
  if (!userToFollow) return null;

  await User.findByIdAndUpdate(followerId, { $addToSet: { following: followingId } });

  const existingNotif = await Notification.findOne({ recipientId: followingId, actorId: followerId, type: "follow" });
  if (!existingNotif) {
    await Notification.create({ recipientId: followingId, actorId: followerId, type: "follow" });
  }

  // `?? 0` y no `|| 1`: el fallback anterior mentía diciendo 1 seguidor cuando
  // el array venía vacío.
  return { followersCount: userToFollow.followers?.length ?? 0 };
}

/** Deja de seguir + elimina la notificación de follow. `null` si no existe. */
export async function unfollowUser(followerId: string, followingId: string) {
  await connectDB();
  const userToUnfollow = await User.findByIdAndUpdate(
    followingId,
    { $pull: { followers: followerId } },
    { returnDocument: "after" },
  );
  if (!userToUnfollow) return null;

  await User.findByIdAndUpdate(followerId, { $pull: { following: followingId } });
  await Notification.findOneAndDelete({ recipientId: followingId, actorId: followerId, type: "follow" });

  return { followersCount: userToUnfollow.followers?.length || 0 };
}

/**
 * Lista de followers/following del usuario `id`. Devuelve la bandera de
 * privacidad para que el controlador decida el acceso. `null` si no existe.
 */
export async function getFollowConnections(id: string, kind: "followers" | "following") {
  await connectDB();
  const target = await User.findById(id)
    .select(`${kind} privacySettings`)
    .lean();
  if (!target) return null;

  const allowFollow = target.privacySettings?.allowFollow ?? true;
  const ids = kind === "followers" ? target.followers : target.following;
  const users = await User.find({ _id: { $in: ids || [] } })
    .select("username displayName avatarUrl")
    .lean();

  return {
    allowFollow,
    users: users.map((u) => ({
      _id: u._id.toString(),
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
    })),
  };
}
