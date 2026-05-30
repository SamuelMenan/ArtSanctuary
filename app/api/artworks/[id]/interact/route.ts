import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@backend/db/mongoose";
import Artwork from "@backend/models/Artwork";
import Notification from "@backend/models/Notification";
import Collection from "@backend/models/Collection";
import { auth } from "@backend/auth";
import { Types } from "mongoose";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { action, text } = await req.json();
    await connectDB();
    const artwork = await Artwork.findById(resolvedParams.id);

    if (!artwork) {
      return NextResponse.json({ error: "Obra no encontrada" }, { status: 404 });
    }

    const isOwner = artwork.artistId.toString() === session.user.id;
    const userId = session.user.id;
    const userObjectId = new Types.ObjectId(userId);
    const likedByIds = artwork.likedBy?.map((id) => id.toString()) ?? [];
    const savedByIds = artwork.savedBy?.map((id) => id.toString()) ?? [];

    if (action === "like") {
      const hasLiked = likedByIds.includes(userId);

      if (hasLiked) {
        // Unlike: Atomic pull and decrement
        const updatedArtwork = await Artwork.findByIdAndUpdate(
          resolvedParams.id,
          { $pull: { likedBy: userObjectId }, $inc: { likes: -1 } },
          { returnDocument: 'after' }
        );
        return NextResponse.json({ success: true, liked: false, likes: Math.max(0, updatedArtwork?.likes ?? 0) });
      } else {
        // Like: Atomic addToSet and increment
        const updatedArtwork = await Artwork.findByIdAndUpdate(
          resolvedParams.id,
          { $addToSet: { likedBy: userObjectId }, $inc: { likes: 1 } },
          { returnDocument: 'after' }
        );

        // Generar notificación si no es el dueño
        if (!isOwner) {
          await Notification.create({
            recipientId: artwork.artistId,
            actorId: userId,
            artworkId: artwork._id,
            type: "like",
          });
        }
        return NextResponse.json({ success: true, liked: true, likes: updatedArtwork?.likes ?? 0 });
      }
    }

    if (action === "save") {
      const hasSaved = savedByIds.includes(userId);
      if (!hasSaved) {
        const updatedArtwork = await Artwork.findByIdAndUpdate(
          resolvedParams.id,
          { $addToSet: { savedBy: userObjectId } },
          { returnDocument: 'after' }
        );

        if (!isOwner) {
          await Notification.create({
            recipientId: artwork.artistId,
            actorId: userId,
            artworkId: artwork._id,
            type: "save",
          });
        }
        return NextResponse.json({ success: true, saved: true, savedCount: updatedArtwork?.savedBy?.length ?? 0 });
      }
      return NextResponse.json({ success: true, saved: true, savedCount: artwork.savedBy?.length ?? 0 });
    }

    if (action === "unsave") {
      const updatedArtwork = await Artwork.findByIdAndUpdate(
        resolvedParams.id,
        { $pull: { savedBy: userObjectId } },
        { returnDocument: 'after' }
      );
      
      // Sync: remove from all user's collections
      await Collection.updateMany(
        { owner: userObjectId },
        { $pull: { artworks: resolvedParams.id } }
      );

      return NextResponse.json({ success: true, saved: false, savedCount: updatedArtwork?.savedBy?.length ?? 0 });
    }

    if (action === "comment") {
      if (!text) return NextResponse.json({ error: "Texto vacío" }, { status: 400 });
      
      const newComment = {
        userId,
        userName: session.user.name || 'Usuario',
        userAvatar: session.user.image || '',
        text,
        createdAt: new Date()
      };

      const updatedArtwork = await Artwork.findByIdAndUpdate(
        resolvedParams.id,
        { $push: { comments: newComment } },
        { returnDocument: 'after' }
      );
      
      // Generar notificación si no es el dueño
      if (!isOwner) {
        await Notification.create({
          recipientId: artwork.artistId,
          actorId: userId,
          artworkId: artwork._id,
          type: "comment",
          message: text.length > 50 ? text.substring(0, 47) + "..." : text
        });
      }

      return NextResponse.json({ success: true, comment: newComment });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error) {
    console.error("[POST /api/artworks/[id]/interact]", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
