import { auth } from "@backend/auth";
import { apiError } from "@backend/http/errors";
import { withErrorHandler } from "@backend/http/handler";
import { createArtwork, getPublicGallery } from "@backend/services/artworks.service";
import { NextRequest, NextResponse } from "next/server";

export const GET = withErrorHandler("GET /api/artworks", async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
    const category = searchParams.get("category");

    const { artworks, total } = await getPublicGallery({ page, limit, category });

    return NextResponse.json({
      artworks,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
});

export const POST = withErrorHandler("POST /api/artworks", async (req: NextRequest) => {
  const session = await auth();
    if (!session?.user?.id) {
      return apiError("UNAUTHORIZED", "No autenticado");
    }

    const body = await req.json();
    if (!body.title || !body.imageUrl) {
      return apiError("VALIDATION_ERROR", "title e imageUrl son obligatorios");
    }

    const artwork = await createArtwork(session.user.id, body);
    return NextResponse.json({ artwork }, { status: 201 });
});
