import { NextRequest, NextResponse } from "next/server";
import { auth } from "@backend/auth";
import { getPublicGallery, createArtwork } from "@backend/services/artworks.service";

/**
 * GET /api/artworks
 * Lista obras públicas con paginación.
 * Query params: page (default 1), limit (default 20, max 50), category (opcional)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
    const category = searchParams.get("category");

    const { artworks, total } = await getPublicGallery({ page, limit, category });

    return NextResponse.json({
      artworks,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /api/artworks]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

/**
 * POST /api/artworks
 * Crea una nueva obra. Requiere sesión activa.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    if (!body.title || !body.imageUrl) {
      return NextResponse.json({ error: "title e imageUrl son obligatorios" }, { status: 400 });
    }

    const artwork = await createArtwork(session.user.id, body);
    return NextResponse.json({ artwork }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/artworks]", error);

    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Error al crear la obra" }, { status: 500 });
  }
}
