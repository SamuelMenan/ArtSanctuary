import { auth } from "@backend/auth";
import { apiError } from "@backend/http/errors";
import { withErrorHandler } from "@backend/http/handler";
import { deleteCollection, getCollectionById, renameCollection } from "@backend/services/collections.service";
import { NextRequest, NextResponse } from "next/server";

export const GET = withErrorHandler("GET /api/collections/[id]", async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const [resolvedParams, session] = await Promise.all([params, auth()]);

    const collection = await getCollectionById(resolvedParams.id);
    if (!collection) return apiError("NOT_FOUND", "No encontrado");

    const isOwner = session?.user?.id === collection.owner.toString();
    if (collection.isPrivate && !isOwner) {
      return apiError("FORBIDDEN", "Colección privada");
    }

    return NextResponse.json({ collection });
});

export const DELETE = withErrorHandler("DELETE /api/collections/[id]", async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const [resolvedParams, session] = await Promise.all([params, auth()]);
    if (!session?.user?.id) return apiError("UNAUTHORIZED", "No autenticado");

    const ok = await deleteCollection(resolvedParams.id, session.user.id);
    if (!ok) return apiError("NOT_FOUND", "No encontrado");
    return NextResponse.json({ success: true });
});

export const PUT = withErrorHandler("PUT /api/collections/[id]", async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const [resolvedParams, session] = await Promise.all([params, auth()]);
    if (!session?.user?.id) return apiError("UNAUTHORIZED", "No autenticado");

    const { name } = await req.json();
    const collection = await renameCollection(resolvedParams.id, session.user.id, name);
    if (!collection) return apiError("NOT_FOUND", "No encontrado");
    return NextResponse.json({ success: true, collection });
});
