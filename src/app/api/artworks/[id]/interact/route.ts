import { NextRequest, NextResponse } from "next/server";
import { auth } from "@backend/auth";
import { interactWithArtwork } from "@backend/services/artworks.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
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
        return NextResponse.json({ error: "Obra no encontrada" }, { status: 404 });
      case "like":
        return NextResponse.json({ success: true, liked: result.liked, likes: result.likes });
      case "save":
        return NextResponse.json({ success: true, saved: true, savedCount: result.savedCount });
      case "unsave":
        return NextResponse.json({ success: true, saved: false, savedCount: result.savedCount });
      case "comment-empty":
        return NextResponse.json({ error: "Texto vacío" }, { status: 400 });
      case "comment":
        return NextResponse.json({ success: true, comment: result.comment });
      default:
        return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    }
  } catch (error) {
    console.error("[POST /api/artworks/[id]/interact]", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
