import { NextRequest, NextResponse } from "next/server";
import { auth } from "@backend/auth";
import { getArtworkForView, updateArtwork, deleteArtwork } from "@backend/services/artworks.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const viewCookieName = `viewed_${id}`;

    const { artwork, setAnonCookie } = await getArtworkForView(id, {
      userId: session?.user?.id,
      alreadyViewedCookie: req.cookies.has(viewCookieName),
    });

    if (!artwork) {
      return NextResponse.json({ error: "Obra no encontrada" }, { status: 404 });
    }

    const response = NextResponse.json(artwork);
    if (setAnonCookie) {
      response.cookies.set(viewCookieName, "true", {
        maxAge: 60 * 60 * 24, // 24 horas
        httpOnly: true,
        sameSite: "lax",
      });
    }
    return response;
  } catch (error) {
    console.error("[GET /api/artworks/[id]]", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const result = await updateArtwork(id, session.user.id, body);
    if (result.status === "notfound") return NextResponse.json({ error: "Obra no encontrada" }, { status: 404 });
    if (result.status === "forbidden") return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    return NextResponse.json(result.data);
  } catch (error) {
    console.error("[PUT /api/artworks/[id]]", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const result = await deleteArtwork(id, session.user.id);
    if (result.status === "notfound") return NextResponse.json({ error: "Obra no encontrada" }, { status: 404 });
    if (result.status === "forbidden") return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/artworks/[id]]", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
