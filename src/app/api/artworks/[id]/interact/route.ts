import { auth } from "@backend/auth";
import { apiError } from "@backend/http/errors";
import { withErrorHandler } from "@backend/http/handler";
import { interactWithArtwork } from "@backend/services/artworks.service";
import { NextRequest, NextResponse } from "next/server";

export const POST = withErrorHandler("POST /api/artworks/[id]/interact", async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return apiError("UNAUTHORIZED", "No autenticado");
    }

    const { action, text } = await req.json();
    const result = await interactWithArtwork({
      id,
      userId: session.user.id,
      userName: session.user.name || "Usuario",
      userImage: session.user.image || "",
      action,
      text,
    });

    switch (result.kind) {
      case "notfound":
        return apiError("NOT_FOUND", "Obra no encontrada");
      case "like":
        return NextResponse.json({ success: true, liked: result.liked, likes: result.likes });
      case "save":
        return NextResponse.json({ success: true, saved: true, savedCount: result.savedCount });
      case "unsave":
        return NextResponse.json({ success: true, saved: false, savedCount: result.savedCount });
      case "comment-empty":
        return apiError("VALIDATION_ERROR", "Texto vacío");
      case "comment":
        return NextResponse.json({ success: true, comment: result.comment });
      default:
        return apiError("VALIDATION_ERROR", "Acción no válida");
    }
});
