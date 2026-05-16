import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Collection from "@/models/Collection";
import { auth } from "@/auth";

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

    await connectDB();

    const collections = await Collection.find({ owner: session.user.id })
      .sort({ updatedAt: -1 })
      .lean();

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

    await connectDB();

    // Límite de colecciones para plan Free
    const count = await Collection.countDocuments({ owner: session.user.id });
    // TODO: verificar plan del usuario para ajustar límite
    const MAX_FREE_COLLECTIONS = 3;
    if (count >= MAX_FREE_COLLECTIONS) {
      return NextResponse.json(
        {
          error: `Has alcanzado el límite de ${MAX_FREE_COLLECTIONS} colecciones. Actualiza a Alma Creativa para crear más.`,
        },
        { status: 403 }
      );
    }

    const collection = await Collection.create({
      name,
      description: description ?? "",
      isPrivate: isPrivate ?? false,
      owner: session.user.id,
    });

    return NextResponse.json({ collection }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/collections]", error);
    return NextResponse.json({ error: "Error al crear la colección" }, { status: 500 });
  }
}
