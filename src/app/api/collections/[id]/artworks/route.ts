import { auth } from "@backend/auth";
import { apiError } from "@backend/http/errors";
import { withErrorHandler } from "@backend/http/handler";
import { addArtworkToCollection, removeArtworkFromCollection } from "@backend/services/collections.service";
import { NextRequest, NextResponse } from "next/server";

export const POST = withErrorHandler("POST /api/collections/[id]/artworks", async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const resolvedParams = await params;
    const session = await auth();
    if (!session?.user?.id) return apiError("UNAUTHORIZED", "No autenticado");

    const { artworkId } = await req.json();
    const collection = await addArtworkToCollection(resolvedParams.id, session.user.id, artworkId);
    if (!collection) return apiError("NOT_FOUND", "Colección no encontrada");

    return NextResponse.json({ success: true, collection });
});

export const DELETE = withErrorHandler("DELETE /api/collections/[id]/artworks", async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const resolvedParams = await params;
    const session = await auth();
    if (!session?.user?.id) return apiError("UNAUTHORIZED", "No autenticado");

    const url = new URL(req.url);
    const artworkId = url.searchParams.get('artworkId');
    if (!artworkId) return apiError("VALIDATION_ERROR", "Falta artworkId");

    const collection = await removeArtworkFromCollection(resolvedParams.id, session.user.id, artworkId);
    if (!collection) return apiError("NOT_FOUND", "Colección no encontrada");

    return NextResponse.json({ success: true, collection });
});
