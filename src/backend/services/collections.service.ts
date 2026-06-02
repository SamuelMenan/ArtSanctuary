/**
 * Collections Service
 * Lógica de dominio de las colecciones. Solo DB (POJOs). Sin HTTP ni React.
 */
import "server-only";
import { connectDB } from "@backend/db/mongoose";
import Collection from "@backend/models/Collection";
import Artwork from "@backend/models/Artwork";

/** Límite de colecciones para el plan Free. */
export const MAX_FREE_COLLECTIONS = 3;

/** Colecciones del usuario, recientes primero. */
export async function getUserCollections(userId: string) {
  await connectDB();
  return Collection.find({ owner: userId }).sort({ updatedAt: -1 }).lean();
}

/** Nº de colecciones del usuario (para el límite Free). */
export async function countUserCollections(userId: string) {
  await connectDB();
  return Collection.countDocuments({ owner: userId });
}

/** Crea una colección. */
export async function createCollection(
  userId: string,
  data: { name: string; description?: string; isPrivate?: boolean },
) {
  await connectDB();
  return Collection.create({
    name: data.name,
    description: data.description ?? "",
    isPrivate: data.isPrivate ?? false,
    owner: userId,
  });
}

/** Colección con artworks poblados, o `null`. POJO. */
export async function getCollectionById(id: string) {
  await connectDB();
  const collection = await Collection.findById(id)
    .populate("artworks", "title imageUrl thumbnails")
    .lean();
  return collection
    ? (JSON.parse(JSON.stringify(collection)) as Record<string, unknown> & { owner: string; isPrivate?: boolean })
    : null;
}

/** Borra la colección si es del usuario. `true` si se borró. */
export async function deleteCollection(id: string, ownerId: string) {
  await connectDB();
  const collection = await Collection.findOneAndDelete({ _id: id, owner: ownerId });
  return !!collection;
}

/** Renombra la colección si es del usuario. POJO o `null`. */
export async function renameCollection(id: string, ownerId: string, name: string) {
  await connectDB();
  return Collection.findOneAndUpdate({ _id: id, owner: ownerId }, { name }, { new: true }).lean();
}

/** Añade un artwork a la colección (+ marca savedBy). POJO o `null`. */
export async function addArtworkToCollection(id: string, ownerId: string, artworkId: string) {
  await connectDB();
  const collection = await Collection.findOneAndUpdate(
    { _id: id, owner: ownerId },
    { $addToSet: { artworks: artworkId } },
    { new: true },
  ).lean();
  if (!collection) return null;
  await Artwork.findByIdAndUpdate(artworkId, { $addToSet: { savedBy: ownerId } });
  return collection;
}

/** Quita un artwork de la colección; limpia savedBy si no queda en otras. POJO o `null`. */
export async function removeArtworkFromCollection(id: string, ownerId: string, artworkId: string) {
  await connectDB();
  const collection = await Collection.findOneAndUpdate(
    { _id: id, owner: ownerId },
    { $pull: { artworks: artworkId } },
    { new: true },
  ).lean();
  if (!collection) return null;

  const otherCollections = await Collection.findOne({ owner: ownerId, artworks: artworkId });
  if (!otherCollections) {
    await Artwork.findByIdAndUpdate(artworkId, { $pull: { savedBy: ownerId } });
  }
  return collection;
}
