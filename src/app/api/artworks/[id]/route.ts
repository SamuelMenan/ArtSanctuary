import { auth } from "@backend/auth";
import { apiError } from "@backend/http/errors";
import { withErrorHandler } from "@backend/http/handler";
import { deleteArtwork, getArtworkForView, updateArtwork } from "@backend/services/artworks.service";
import { NextRequest, NextResponse } from "next/server";

export const GET = withErrorHandler("GET /api/artworks/[id]", async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
    const session = await auth();
    const viewCookieName = `viewed_${id}`;

    const { artwork, setAnonCookie } = await getArtworkForView(id, {
      userId: session?.user?.id,
      alreadyViewedCookie: req.cookies.has(viewCookieName),
    });

    if (!artwork) {
      return apiError("NOT_FOUND", "Obra no encontrada");
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
});

export const PUT = withErrorHandler("PUT /api/artworks/[id]", async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return apiError("UNAUTHORIZED", "No autenticado");
    }

    const body = await req.json();
    const result = await updateArtwork(id, session.user.id, body);
    if (result.status === "notfound") return apiError("NOT_FOUND", "Obra no encontrada");
    if (result.status === "forbidden") return apiError("FORBIDDEN", "No autorizado");
    return NextResponse.json(result.data);
});

export const DELETE = withErrorHandler("DELETE /api/artworks/[id]", async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return apiError("UNAUTHORIZED", "No autenticado");
    }

    const result = await deleteArtwork(id, session.user.id);
    if (result.status === "notfound") return apiError("NOT_FOUND", "Obra no encontrada");
    if (result.status === "forbidden") return apiError("FORBIDDEN", "No autorizado");
    return NextResponse.json({ success: true });
});
