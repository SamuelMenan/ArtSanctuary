import { auth } from "@backend/auth";
import { apiError } from "@backend/http/errors";
import { withErrorHandler } from "@backend/http/handler";
import { countUserCollections, createCollection, getUserCollections, MAX_FREE_COLLECTIONS } from "@backend/services/collections.service";
import { NextRequest, NextResponse } from "next/server";

export const GET = withErrorHandler("GET /api/collections", async () => {
  const session = await auth();
    if (!session?.user?.id) {
      return apiError("UNAUTHORIZED", "No autenticado");
    }

    const collections = await getUserCollections(session.user.id);
    return NextResponse.json({ collections });
});

export const POST = withErrorHandler("POST /api/collections", async (req: NextRequest) => {
  const session = await auth();
    if (!session?.user?.id) {
      return apiError("UNAUTHORIZED", "No autenticado");
    }

    const body = await req.json();
    const { name, description, isPrivate } = body;

    if (!name) {
      return apiError("VALIDATION_ERROR", "El nombre de la colección es obligatorio");
    }

    // TODO: verificar plan del usuario para ajustar límite
    const count = await countUserCollections(session.user.id);
    if (count >= MAX_FREE_COLLECTIONS) {
      return NextResponse.json(
        {
          error: `Has alcanzado el límite de ${MAX_FREE_COLLECTIONS} colecciones. Actualiza a Alma Creativa para crear más.`,
        },
        { status: 403 }
      );
    }

    const collection = await createCollection(session.user.id, { name, description, isPrivate });
    return NextResponse.json({ collection }, { status: 201 });
});
