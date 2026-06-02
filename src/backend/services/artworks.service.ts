/**
 * Artworks Service
 * Lógica de dominio de las obras (galería, búsqueda, subida, interacciones).
 * Solo DB (POJOs). Sin HTTP ni React.
 */
import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@backend/db/mongoose";
import Artwork from "@backend/models/Artwork";
import Notification from "@backend/models/Notification";
import Collection from "@backend/models/Collection";

interface PageParams { page: number; limit: number }

/** Galería pública paginada (filtro opcional por categoría). */
export async function getPublicGallery({ page, limit, category }: PageParams & { category?: string | null }) {
  await connectDB();
  const skip = (page - 1) * limit;
  const filter: Record<string, unknown> = { visibility: "public" };
  if (category && category !== "todas") filter.category = category;

  const [artworks, total] = await Promise.all([
    Artwork.find(filter)
      .sort({ uploadDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate("artistId", "username displayName avatarUrl")
      .lean(),
    Artwork.countDocuments(filter),
  ]);
  return { artworks, total };
}

/** Búsqueda pública con texto libre + filtros. */
export async function searchArtworks(opts: PageParams & {
  q?: string; category?: string | null; medium?: string | null; technique?: string | null; tags?: string | null;
}) {
  await connectDB();
  const skip = (opts.page - 1) * opts.limit;
  const filter: Record<string, unknown> = { visibility: "public" };

  if (opts.q) {
    filter.$or = [
      { title: { $regex: opts.q, $options: "i" } },
      { description: { $regex: opts.q, $options: "i" } },
      { tags: { $regex: opts.q, $options: "i" } },
      { medium: { $regex: opts.q, $options: "i" } },
      { technique: { $regex: opts.q, $options: "i" } },
      { category: { $regex: opts.q, $options: "i" } },
    ];
  }
  if (opts.category && opts.category !== "todas") filter.category = opts.category;
  if (opts.medium) filter.medium = { $regex: opts.medium, $options: "i" };
  if (opts.technique) filter.technique = { $regex: opts.technique, $options: "i" };
  if (opts.tags) {
    const tagsArray = opts.tags.split(",").map((t) => t.trim());
    filter.tags = { $in: tagsArray.map((t) => new RegExp(t, "i")) };
  }

  const [artworks, total] = await Promise.all([
    Artwork.find(filter)
      .sort({ uploadDate: -1 })
      .skip(skip)
      .limit(opts.limit)
      .populate("artistId", "username displayName avatarUrl")
      .lean(),
    Artwork.countDocuments(filter),
  ]);
  return { artworks, total };
}

/** Crea una obra con fileMeta/thumbnails derivados. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- payload = body de la request (forma dinámica del cliente).
export async function createArtwork(userId: string, payload: Record<string, any>) {
  await connectDB();
  const imageUrl = payload.imageUrl as string;
  const fileMeta = {
    filename: `artwork_${Date.now()}.jpg`,
    mimeType: "image/jpeg",
    sizeBytes: Math.floor(Math.random() * 2000000) + 100000,
  };
  const thumbnails = { small: imageUrl, medium: imageUrl, large: imageUrl };

  return Artwork.create({
    title: payload.title,
    imageUrl,
    artistId: userId,
    uploadDate: new Date(),
    creationDate: payload.creationDate,
    artistProvidedDateText: payload.artistProvidedDateText,
    description: payload.description ?? "",
    category: payload.category ?? "otro",
    medium: payload.medium,
    technique: payload.technique,
    materials: payload.materials ?? [],
    dimensions: payload.dimensions,
    edition: payload.edition,
    signature: payload.signature,
    signatureLocation: payload.signatureLocation,
    provenance: payload.provenance,
    visibility: payload.visibility ?? "public",
    altText: payload.altText,
    licenseRights: payload.licenseRights,
    tags: payload.tags ?? [],
    fileMeta,
    thumbnails,
  });
}

/**
 * Obra por id (autor poblado) + registro de vista. Incrementa en background.
 * Devuelve si el controlador debe fijar la cookie de vista anónima.
 */
export async function getArtworkForView(id: string, viewer: { userId?: string; alreadyViewedCookie: boolean }) {
  await connectDB();
  const artwork = await Artwork.findById(id)
    .populate("artistId", "username displayName avatarUrl")
    .lean();
  if (!artwork) return { artwork: null, setAnonCookie: false };

  let setAnonCookie = false;
  if (viewer.userId) {
    const alreadyViewed = await Artwork.exists({ _id: id, viewedBy: viewer.userId });
    if (!alreadyViewed) {
      Artwork.findByIdAndUpdate(id, { $inc: { views: 1 }, $addToSet: { viewedBy: viewer.userId } }).exec();
    }
  } else if (!viewer.alreadyViewedCookie) {
    Artwork.findByIdAndUpdate(id, { $inc: { views: 1 } }).exec();
    setAnonCookie = true;
  }
  return { artwork, setAnonCookie };
}

type OwnedResult<T> = { status: "ok"; data: T } | { status: "notfound" } | { status: "forbidden" };

/** Actualiza campos editables si el usuario es el autor. */
export async function updateArtwork(id: string, userId: string, body: Record<string, unknown>): Promise<OwnedResult<unknown>> {
  await connectDB();
  const artwork = await Artwork.findById(id);
  if (!artwork) return { status: "notfound" };
  if (artwork.artistId.toString() !== userId) return { status: "forbidden" };

  const mutable = artwork as typeof artwork & Record<string, unknown>;
  Object.keys(body).forEach((key) => {
    if (key !== "_id" && key !== "artistId" && key !== "uploadDate" && key !== "views" && key !== "likes") {
      mutable[key] = body[key];
    }
  });
  await artwork.save();
  return { status: "ok", data: artwork };
}

/** Borra la obra si el usuario es el autor. */
export async function deleteArtwork(id: string, userId: string): Promise<OwnedResult<null>> {
  await connectDB();
  const artwork = await Artwork.findById(id);
  if (!artwork) return { status: "notfound" };
  if (artwork.artistId.toString() !== userId) return { status: "forbidden" };
  await Artwork.findByIdAndDelete(id);
  return { status: "ok", data: null };
}

export type InteractResult =
  | { kind: "notfound" }
  | { kind: "like"; liked: boolean; likes: number }
  | { kind: "save"; savedCount: number }
  | { kind: "unsave"; savedCount: number }
  | { kind: "comment"; comment: Record<string, unknown> }
  | { kind: "comment-empty" }
  | { kind: "invalid" };

/** Interacciones con una obra: like/unlike, save/unsave, comment (+ notificaciones). */
export async function interactWithArtwork(opts: {
  id: string; userId: string; userName: string; userImage: string; action: string; text?: string;
}): Promise<InteractResult> {
  await connectDB();
  const { id, userId, action, text } = opts;
  const artwork = await Artwork.findById(id);
  if (!artwork) return { kind: "notfound" };

  const isOwner = artwork.artistId.toString() === userId;
  const userObjectId = new Types.ObjectId(userId);
  const likedByIds = artwork.likedBy?.map((x) => x.toString()) ?? [];
  const savedByIds = artwork.savedBy?.map((x) => x.toString()) ?? [];

  if (action === "like") {
    const hasLiked = likedByIds.includes(userId);
    if (hasLiked) {
      const updated = await Artwork.findByIdAndUpdate(id, { $pull: { likedBy: userObjectId }, $inc: { likes: -1 } }, { returnDocument: "after" });
      return { kind: "like", liked: false, likes: Math.max(0, updated?.likes ?? 0) };
    }
    const updated = await Artwork.findByIdAndUpdate(id, { $addToSet: { likedBy: userObjectId }, $inc: { likes: 1 } }, { returnDocument: "after" });
    if (!isOwner) {
      await Notification.create({ recipientId: artwork.artistId, actorId: userId, artworkId: artwork._id, type: "like" });
    }
    return { kind: "like", liked: true, likes: updated?.likes ?? 0 };
  }

  if (action === "save") {
    const hasSaved = savedByIds.includes(userId);
    if (!hasSaved) {
      const updated = await Artwork.findByIdAndUpdate(id, { $addToSet: { savedBy: userObjectId } }, { returnDocument: "after" });
      if (!isOwner) {
        await Notification.create({ recipientId: artwork.artistId, actorId: userId, artworkId: artwork._id, type: "save" });
      }
      return { kind: "save", savedCount: updated?.savedBy?.length ?? 0 };
    }
    return { kind: "save", savedCount: artwork.savedBy?.length ?? 0 };
  }

  if (action === "unsave") {
    const updated = await Artwork.findByIdAndUpdate(id, { $pull: { savedBy: userObjectId } }, { returnDocument: "after" });
    await Collection.updateMany({ owner: userObjectId }, { $pull: { artworks: id } });
    return { kind: "unsave", savedCount: updated?.savedBy?.length ?? 0 };
  }

  if (action === "comment") {
    if (!text) return { kind: "comment-empty" };
    const newComment = {
      userId,
      userName: opts.userName,
      userAvatar: opts.userImage,
      text,
      createdAt: new Date(),
    };
    await Artwork.findByIdAndUpdate(id, { $push: { comments: newComment } }, { returnDocument: "after" });
    if (!isOwner) {
      await Notification.create({
        recipientId: artwork.artistId,
        actorId: userId,
        artworkId: artwork._id,
        type: "comment",
        message: text.length > 50 ? text.substring(0, 47) + "..." : text,
      });
    }
    return { kind: "comment", comment: newComment };
  }

  return { kind: "invalid" };
}
