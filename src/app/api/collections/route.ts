import { NextRequest, NextResponse } from "next/server";
import { auth } from "@backend/auth";
import { getUserCollections, countUserCollections, createCollection, MAX_FREE_COLLECTIONS } from "@backend/services/collections.service";

/**
 * GET /api/collections
 * Lista las colecciones del usuario autenticado.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const collections = await getUserCollections(session.user.id);
    return NextResponse.json({ collections });
  } catch (error) {
    console.error("[GET /api/collections]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

/**
 * POST /api/collections
 * Crea una nueva colección. Requiere sesión activa.
 * Usuarios Free: máximo 3 colecciones.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, isPrivate } = body;

    if (!name) {
      return NextResponse.json(
        { error: "El nombre de la colección es obligatorio" },
        { status: 400 }
      );
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
  } catch (error) {
    console.error("[POST /api/collections]", error);
    return NextResponse.json({ error: "Error al crear la colección" }, { status: 500 });
  }
}
